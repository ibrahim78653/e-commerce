from fastapi import APIRouter, Depends, HTTPException
import schemas, auth, database
from typing import List, Any, Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api", tags=["Promos"])


def strip_oid(doc):
    if isinstance(doc, list):
        return [strip_oid(d) for d in doc]
    if isinstance(doc, dict):
        return {k: strip_oid(v) for k, v in doc.items() if k != "_id"}
    return doc


# ── Public: validate a promo code ────────────────────────────────────────────
@router.post("/promos/validate")
async def validate_promo(data: schemas.PromoValidate, db: Any = Depends(database.get_db)):
    promo = await db.promos.find_one({"code": data.code.upper().strip()})
    if not promo:
        raise HTTPException(status_code=404, detail="Invalid promo code")

    if not promo.get("is_active", True):
        raise HTTPException(status_code=400, detail="Promo code is inactive")

    expires_at = promo.get("expires_at")
    if expires_at:
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Promo code has expired")

    min_order = promo.get("min_order_value", 0)
    if data.order_value < min_order:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order value for this code is ₹{min_order}"
        )

    # Calculate discount
    discount_type = promo.get("discount_type", "percentage")
    discount_value = promo.get("discount_value", 0)
    max_discount = promo.get("max_discount")

    if discount_type == "percentage":
        discount_amount = (data.order_value * discount_value) / 100
        if max_discount:
            discount_amount = min(discount_amount, max_discount)
    else:  # fixed
        discount_amount = min(discount_value, data.order_value)

    final_amount = max(data.order_value - discount_amount, 0)

    return {
        "valid": True,
        "code": promo["code"],
        "discount_type": discount_type,
        "discount_value": discount_value,
        "discount_amount": round(discount_amount, 2),
        "final_amount": round(final_amount, 2),
        "message": f"Promo applied! You save ₹{discount_amount:.0f}"
    }


# ── Admin: list all promos ────────────────────────────────────────────────────
@router.get("/admin/promos")
async def list_promos(admin: Any = Depends(auth.get_admin), db: Any = Depends(database.get_db)):
    promos = await db.promos.find().sort("created_at", -1).to_list(length=200)
    return strip_oid(promos)


# ── Admin: create promo ───────────────────────────────────────────────────────
@router.post("/admin/promos")
async def create_promo(data: schemas.PromoCreate, admin: Any = Depends(auth.get_admin), db: Any = Depends(database.get_db)):
    code = data.code.upper().strip()
    existing = await db.promos.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=400, detail="Promo code already exists")

    new_id = await database.get_next_id(db, "promos")
    promo = data.dict()
    promo["id"] = new_id
    promo["code"] = code
    promo["created_at"] = datetime.utcnow()

    await db.promos.insert_one(promo)
    return strip_oid(promo)


# ── Admin: update promo ───────────────────────────────────────────────────────
@router.put("/admin/promos/{promo_id}")
async def update_promo(promo_id: int, data: schemas.PromoCreate, admin: Any = Depends(auth.get_admin), db: Any = Depends(database.get_db)):
    promo = await db.promos.find_one({"id": promo_id})
    if not promo:
        raise HTTPException(status_code=404, detail="Promo not found")

    update = data.dict()
    update["code"] = update["code"].upper().strip()
    await db.promos.update_one({"id": promo_id}, {"$set": update})
    updated = await db.promos.find_one({"id": promo_id})
    return strip_oid(updated)


# ── Admin: delete promo ───────────────────────────────────────────────────────
@router.delete("/admin/promos/{promo_id}")
async def delete_promo(promo_id: int, admin: Any = Depends(auth.get_admin), db: Any = Depends(database.get_db)):
    promo = await db.promos.find_one({"id": promo_id})
    if not promo:
        raise HTTPException(status_code=404, detail="Promo not found")
    await db.promos.delete_one({"id": promo_id})
    return {"message": "Promo deleted"}
