"""
Bulk Product Image Import Router
=================================
Accepts a ZIP file containing product images named by convention:
    PROD-030_1.webp  → product_id=PROD-030, order=1
    PROD-030_2.jpg   → product_id=PROD-030, order=2

Processing is done in the background (BackgroundTasks) so the HTTP
response is immediate. The client polls GET /status/{job_id} for updates.

Supports up to 5000+ images by streaming ZIP to disk and processing
in configurable batches — never loading all files into memory at once.
"""

import os
import re
import uuid
import zipfile
import shutil
import logging
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from PIL import Image

import auth
import database
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Bulk Image Import"])

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────

BATCH_SIZE = 50          # products per batch (controls peak DB round-trips)
CHUNK_SIZE = 1024 * 1024 # 1 MB chunks when reading upload stream
TEMP_ROOT  = "temp_imports"
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

# Pattern: PROD-030_1.webp  — product_id = PROD-030, order = 1
# Product ID: one or more alphanum groups joined by hyphens, last group is digits
FILENAME_RE = re.compile(
    r"^(?P<pid>[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)_(?P<order>\d+)"
    r"\.(?P<ext>jpg|jpeg|png|webp)$",
    re.IGNORECASE,
)

# ──────────────────────────────────────────────────────────────────────────────
# In-memory job store  (replace with Redis for multi-worker deployments)
# ──────────────────────────────────────────────────────────────────────────────
_jobs: dict[str, dict] = {}


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _parse_filename(basename: str) -> Optional[tuple[str, int]]:
    """
    Parse image basename → (product_id_upper, order) or None if invalid.
    Valid:   PROD-030_1.webp  → ('PROD-030', 1)
    Invalid: random.jpg, image1.png, PROD030.jpg  → None
    """
    m = FILENAME_RE.match(basename)
    if not m:
        return None
    return m.group("pid").upper(), int(m.group("order"))


def _make_job(job_id: str) -> dict:
    """Return a fresh job state dict."""
    return {
        "job_id": job_id,
        "status": "queued",        # queued → processing → completed | failed
        "progress": 0,             # 0–100
        "total_files": 0,
        "successfully_mapped": 0,
        "missing_products": [],
        "invalid_files": [],
        "failed_images": [],
        "products_in_zip": [],
        "created_at": datetime.utcnow().isoformat(),
        "started_at": None,
        "completed_at": None,
        "error": None,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Background processing task
# ──────────────────────────────────────────────────────────────────────────────

async def _process_zip(job_id: str, zip_path: str, temp_dir: str) -> None:
    """
    Full pipeline executed as a FastAPI BackgroundTask:
        1. Extract ZIP to disk (streaming, not in memory)
        2. Parse filenames → group by product_id, sort by order
        3. Batch-fetch products from MongoDB
        4. Convert each image to WebP, save to upload dir
        5. Replace product_images records in MongoDB
        6. Update job progress & final report
    """
    from database import client
    from config import settings as cfg

    db  = client[cfg.DB_NAME]
    job = _jobs[job_id]
    job["status"]     = "processing"
    job["started_at"] = datetime.utcnow().isoformat()

    try:
        # ── Step 1: Extract ZIP ───────────────────────────────────────────────
        extract_dir = os.path.join(temp_dir, "extracted")
        os.makedirs(extract_dir, exist_ok=True)

        with zipfile.ZipFile(zip_path, "r") as zf:
            # Filter to image-only members; skip macOS artifacts & hidden files
            members = [
                m for m in zf.namelist()
                if not m.startswith("__MACOSX")
                and not os.path.basename(m).startswith(".")
                and os.path.splitext(m)[1].lower() in ALLOWED_EXTS
                and not m.endswith("/")          # skip directory entries
            ]
            job["total_files"] = len(members)
            logger.info("[%s] ZIP contains %d image files", job_id, len(members))

            # Extract in one pass (files streamed to disk by zipfile module)
            zf.extractall(extract_dir, members=members)

        # ── Step 2: Parse filenames & group by product_id ─────────────────────
        # grouped: { 'PROD-030': [(order, abs_path, basename), ...], ... }
        grouped: dict[str, list[tuple[int, str, str]]] = {}
        invalid_files: list[str] = []

        for member in members:
            basename = os.path.basename(member)
            parsed   = _parse_filename(basename)
            if parsed is None:
                invalid_files.append(basename)
                logger.debug("[%s] Invalid filename skipped: %s", job_id, basename)
                continue
            pid, order = parsed
            abs_path   = os.path.join(extract_dir, member)
            grouped.setdefault(pid, []).append((order, abs_path, basename))

        # Sort images within each product by their order number
        for pid in grouped:
            grouped[pid].sort(key=lambda x: x[0])

        job["invalid_files"]   = invalid_files
        job["products_in_zip"] = list(grouped.keys())

        upload_dir = cfg.UPLOAD_DIR
        os.makedirs(upload_dir, exist_ok=True)

        successfully_mapped = 0
        missing_products: list[str] = []
        failed_images: list[str]    = []
        product_ids = list(grouped.keys())

        # ── Step 3 & 4 & 5: Batch process ─────────────────────────────────────
        for batch_start in range(0, len(product_ids), BATCH_SIZE):
            batch_pids = product_ids[batch_start : batch_start + BATCH_SIZE]

            # Fetch all products in this batch with a single query
            products = await db.products.find(
                {"product_id": {"$in": batch_pids}}
            ).to_list(None)
            product_map = {p["product_id"]: p for p in products}

            for pid in batch_pids:
                if pid not in product_map:
                    missing_products.append(pid)
                    logger.warning("[%s] Product not found: %s", job_id, pid)
                    continue

                product      = product_map[pid]
                product_db_id = product["id"]

                # Delete existing base images (preserve color-variant images)
                await db.product_images.delete_many({
                    "product_id": product_db_id,
                    "color_variant_id": None,
                })

                new_records: list[dict] = []
                for order, abs_path, original_name in grouped[pid]:
                    try:
                        # Convert to WebP + save
                        unique_name = f"{uuid.uuid4()}.webp"
                        dest_path   = os.path.join(upload_dir, unique_name)

                        with Image.open(abs_path) as img:
                            # Flatten transparency for formats that don't support it
                            if img.mode in ("RGBA", "P", "LA"):
                                background = Image.new("RGB", img.size, (255, 255, 255))
                                background.paste(
                                    img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None
                                )
                                img = background
                            elif img.mode != "RGB":
                                img = img.convert("RGB")

                            img.save(dest_path, format="WEBP", quality=85, optimize=True)

                        image_url = f"/static/uploads/{unique_name}"

                        # Auto-increment image ID counter
                        counter_doc = await db.counters.find_one_and_update(
                            {"_id": "product_images"},
                            {"$inc": {"seq": 1}},
                            upsert=True,
                            return_document=True,
                        )
                        img_id = counter_doc["seq"]

                        new_records.append({
                            "id":               img_id,
                            "product_id":       product_db_id,
                            "color_variant_id": None,
                            "image_url":        image_url,
                            "is_primary":       (order == 1),  # smallest order = primary
                            "order":            order,
                        })
                        successfully_mapped += 1

                    except Exception as exc:
                        logger.error(
                            "[%s] Failed to process image %s: %s",
                            job_id, original_name, exc
                        )
                        failed_images.append(original_name)

                # Bulk-insert new image records for this product
                if new_records:
                    await db.product_images.insert_many(new_records)

            # Update progress after each batch
            processed = min(batch_start + BATCH_SIZE, len(product_ids))
            job["progress"] = round((processed / len(product_ids)) * 100)

        # ── Step 6: Finalise ──────────────────────────────────────────────────
        job.update({
            "status":             "completed",
            "progress":           100,
            "completed_at":       datetime.utcnow().isoformat(),
            "successfully_mapped": successfully_mapped,
            "missing_products":   missing_products,
            "failed_images":      failed_images,
        })
        logger.info(
            "[%s] Completed. mapped=%d missing=%d invalid=%d failed=%d",
            job_id, successfully_mapped, len(missing_products),
            len(invalid_files), len(failed_images),
        )

    except Exception as exc:
        logger.exception("[%s] Fatal error: %s", job_id, exc)
        job.update({
            "status":       "failed",
            "error":        str(exc),
            "completed_at": datetime.utcnow().isoformat(),
        })

    finally:
        # Always clean up temp files regardless of outcome
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass


# ──────────────────────────────────────────────────────────────────────────────
# API Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/bulk-image-import")
async def start_bulk_image_import(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    admin: Any = Depends(auth.get_admin),
):
    """
    Upload a ZIP of product images and start asynchronous processing.
    Returns immediately with a `job_id`; poll /status/{job_id} for progress.
    """
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files are accepted.")

    # Stream ZIP to disk in 1 MB chunks — no memory blowup for large archives
    job_id   = str(uuid.uuid4())
    temp_dir = os.path.join(TEMP_ROOT, job_id)
    os.makedirs(temp_dir, exist_ok=True)
    zip_path = os.path.join(temp_dir, "upload.zip")

    try:
        with open(zip_path, "wb") as fp:
            while True:
                chunk = await file.read(CHUNK_SIZE)
                if not chunk:
                    break
                fp.write(chunk)
    except Exception as exc:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Failed to save upload: {exc}")

    # Validate ZIP integrity before starting the job
    if not zipfile.is_zipfile(zip_path):
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail="File is not a valid ZIP archive.")

    # Register job and enqueue background task
    _jobs[job_id] = _make_job(job_id)
    background_tasks.add_task(_process_zip, job_id=job_id, zip_path=zip_path, temp_dir=temp_dir)

    return {
        "job_id": job_id,
        "message": "Import queued. Poll /api/admin/bulk-image-import/status/{job_id}.",
    }


@router.get("/bulk-image-import/status/{job_id}")
async def get_import_status(
    job_id: str,
    admin: Any = Depends(auth.get_admin),
):
    """Return current status and report for a given import job."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job


@router.get("/bulk-image-import/jobs")
async def list_import_jobs(admin: Any = Depends(auth.get_admin)):
    """Return the most recent 20 import jobs, newest first."""
    jobs = sorted(_jobs.values(), key=lambda j: j["created_at"], reverse=True)
    return jobs[:20]


@router.get("/bulk-image-import/report/{job_id}")
async def download_error_report(
    job_id: str,
    admin: Any = Depends(auth.get_admin),
):
    """
    Stream a CSV error report for a given import job.
    Includes missing products, invalid filenames, and failed images.
    """
    import csv
    import io
    from fastapi.responses import StreamingResponse

    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    buf = io.StringIO()
    writer = csv.writer(buf)

    # Header row
    writer.writerow(["error_type", "identifier", "notes"])

    # Missing product IDs (product not found in DB)
    for pid in job.get("missing_products", []):
        writer.writerow([
            "missing_product",
            pid,
            "Product ID not found in the database — import the product via Excel first",
        ])

    # Invalid filenames (don't match PRODID_ORDER.ext pattern)
    for fname in job.get("invalid_files", []):
        writer.writerow([
            "invalid_filename",
            fname,
            "Filename does not match required pattern PRODUCT_ID_ORDER.extension",
        ])

    # Images that matched but failed during processing (PIL error, disk error, etc.)
    for fname in job.get("failed_images", []):
        writer.writerow([
            "processing_failed",
            fname,
            "Image conversion or storage upload failed — check server logs for details",
        ])

    buf.seek(0)
    filename = f"import_report_{job_id[:8]}.csv"
    logger.info("[%s] Error report downloaded", job_id)

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
