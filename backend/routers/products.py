from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import schemas, auth, database
from typing import List, Optional, Any
import os
import shutil
import logging
from config import settings
import math
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Products"])


def strip_oid(doc):
    """Recursively remove MongoDB _id fields from a document or list of documents."""
    if isinstance(doc, list):
        return [strip_oid(d) for d in doc]
    if isinstance(doc, dict):
        return {k: strip_oid(v) for k, v in doc.items() if k != "_id"}
    return doc


async def sync_main_to_excel(product_id_int: int, db: Any):
    try:
        p = await db.products.find_one({"id": product_id_int})
        if not p:
            return
        
        pid = p.get("product_id")
        if not pid or not str(pid).strip():
            pid = f"PROD-{str(product_id_int).zfill(3)}"
            await db.products.update_one({"id": product_id_int}, {"$set": {"product_id": pid}})
            
        # Category resolution
        category_name = p.get("category")
        if not category_name and p.get("category_id"):
            cat = await db.categories.find_one({"id": p["category_id"]})
            if cat:
                category_name = cat.get("name")
        if not category_name:
            category_name = "Common"
            
        # Images resolution
        images = await db.product_images.find({"product_id": product_id_int, "color_variant_id": None}).sort("id", 1).to_list(length=100)
        image_urls = [img["image_url"] for img in images if img.get("image_url")]
        if not image_urls:
            # Fallback to variant images if no base images are defined
            variant_images = await db.product_images.find({"product_id": product_id_int, "color_variant_id": {"$ne": None}}).sort("id", 1).to_list(length=100)
            image_urls = list(dict.fromkeys([img["image_url"] for img in variant_images if img.get("image_url")]))
            
        # Colors & Sizes resolution
        colors_str = p.get("colors") or ""
        colors = [c.strip() for c in colors_str.split(",") if c.strip()]
        if not colors:
            variants = await db.product_color_variants.find({"product_id": product_id_int}).to_list(length=100)
            colors = [v["color_name"] for v in variants if v.get("color_name")]
            if colors:
                colors_str = ",".join(colors)
                await db.products.update_one({"id": product_id_int}, {"$set": {"colors": colors_str}})
                
        sizes_str = p.get("sizes") or ""
        sizes = [s.strip() for s in sizes_str.split(",") if s.strip()]
        
        # Upsert excel_products
        excel_existing = await db.excel_products.find_one({"product_id": pid})
        if excel_existing:
            await db.excel_products.update_one(
                {"product_id": pid},
                {"$set": {
                    "product_name": p.get("name"),
                    "original_price": p.get("original_price", 0),
                    "discounted_price": p.get("discounted_price"),
                    "description": p.get("description", ""),
                    "is_active": p.get("is_active", True),
                    "stock": p.get("stock", 0),
                    "category": category_name,
                    "updated_at": datetime.utcnow()
                }}
            )
        else:
            await db.excel_products.insert_one({
                "product_id": pid,
                "product_name": p.get("name"),
                "original_price": p.get("original_price", 0),
                "discounted_price": p.get("discounted_price"),
                "description": p.get("description", ""),
                "is_active": p.get("is_active", True),
                "stock": p.get("stock", 0),
                "category": category_name,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            
        # Sync relations
        await db.excel_product_colors.delete_many({"product_id": pid})
        await db.excel_product_sizes.delete_many({"product_id": pid})
        await db.excel_product_images.delete_many({"product_id": pid})
        
        for c in colors:
            await db.excel_product_colors.insert_one({"product_id": pid, "color_name": c})
        for s in sizes:
            await db.excel_product_sizes.insert_one({"product_id": pid, "size_value": s})
        for idx, img_url in enumerate(image_urls):
            await db.excel_product_images.insert_one({
                "product_id": pid,
                "image_url": img_url,
                "sort_order": idx
            })
    except Exception as e:
        print(f"Error in sync_main_to_excel for product {product_id_int}: {e}")


@router.get("/products", response_model=schemas.ProductListResponse)
async def get_products(
    category_id: Optional[int] = None, 
    page: int = 1,
    page_size: int = 12,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    is_featured: Optional[bool] = None,
    is_active: Optional[bool] = None, # Allow filtering by status
    admin_view: bool = False, # Flag to override defaults for admin
    db: Any = Depends(database.get_db)
):
    filt = {}
    
    if admin_view:
        if is_active is not None:
            filt["is_active"] = is_active
    else:
        status_to_filter = is_active if is_active is not None else True
        filt["is_active"] = status_to_filter
    
    if category_id:
        filt["category_id"] = category_id
        
    if search:
        filt["name"] = {"$regex": search, "$options": "i"}
        
    if is_featured:
        filt["is_featured"] = True
        
    # Sorting
    sort_field = "id"
    if sort_by == "price":
        sort_field = "original_price"
    elif sort_by == "name":
        sort_field = "name"
    elif sort_by == "stock":
        sort_field = "stock"

    direction = -1 if sort_order == "desc" else 1
    
    logger.debug(f"Products query filter: {filt}")
    total = await db.products.count_documents(filt)
    logger.debug(f"Products total count: {total}")
    pages = math.ceil(total / page_size) if page_size > 0 else 1
    offset = (page - 1) * page_size
    
    cursor = db.products.find(filt).sort(sort_field, direction).skip(offset).limit(page_size)
    items = await cursor.to_list(length=page_size)
    logger.debug(f"Products items fetched: {len(items)}")

    # Fetch categories, images, and variants for these products
    # This is a bit more manual in MongoDB
    populated_items = []
    for item in items:
        # Category — always set key (even if None) to satisfy response schema
        item["category"] = None
        if item.get("category_id"):
            cat = await db.categories.find_one({"id": item["category_id"]})
            if cat:
                item["category"] = strip_oid(cat)
        elif item.get("category"):
            item["category"] = {"id": None, "name": item.get("category"), "description": ""}
        
        # Images (base images have color_variant_id = None or null)
        item["images"] = await db.product_images.find({"product_id": item["id"], "color_variant_id": None}).to_list(length=100)
        
        # Color Variants
        variants = await db.product_color_variants.find({"product_id": item["id"]}).to_list(length=100)
        for v in variants:
            v["images"] = await db.product_images.find({"color_variant_id": v["id"]}).to_list(length=100)
        item["color_variants"] = variants
        
        populated_items.append(item)

    return {
        "items": strip_oid(populated_items),
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages
    }

@router.get("/products/{product_id}", response_model=schemas.ProductResponse)
async def get_product(product_id: int, db: Any = Depends(database.get_db)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Populate relationships — always set key to satisfy response schema
    product["category"] = None
    if product.get("category_id"):
        cat = await db.categories.find_one({"id": product["category_id"]})
        if cat:
            product["category"] = strip_oid(cat)
    elif product.get("category"):
        product["category"] = {"id": None, "name": product.get("category"), "description": ""}
    
    product["images"] = await db.product_images.find({"product_id": product_id, "color_variant_id": None}).to_list(length=100)
    
    variants = await db.product_color_variants.find({"product_id": product_id}).to_list(length=100)
    for v in variants:
        v["images"] = await db.product_images.find({"color_variant_id": v["id"]}).to_list(length=100)
    product["color_variants"] = variants
    
    return strip_oid(product)

async def get_next_id(db: Any, collection_name: str):
    res = await db.counters.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return res["seq"]

@router.post("/products", response_model=schemas.ProductResponse)
async def create_product(product_data: schemas.ProductCreate, db: Any = Depends(database.get_db), admin: Any = Depends(auth.get_admin)):
    # Check if slug already exists
    existing_product = await db.products.find_one({"slug": product_data.slug})
    if existing_product:
        import time
        product_data.slug = f"{product_data.slug}-{int(time.time())}"

    try:
        # Determine next ID
        # Initialize counter if not exists (should be done once ideally)
        count_doc = await db.counters.find_one({"_id": "products"})
        if not count_doc:
            # Seed from current data
            max_prod = await db.products.find_one(sort=[("id", -1)])
            start_val = max_prod.get("id", 0) if max_prod else 0
            await db.counters.update_one({"_id": "products"}, {"$set": {"seq": start_val}}, upsert=True)

        new_id = await get_next_id(db, "products")
        
        product_dict = product_data.dict(exclude={'image_urls', 'color_variants'})
        product_dict["id"] = new_id
        if not product_dict.get("product_id") or not str(product_dict.get("product_id")).strip():
            product_dict["product_id"] = f"PROD-{str(new_id).zfill(3)}"
        else:
            # Check for conflict
            conflict = await db.products.find_one({"product_id": product_dict["product_id"]})
            if conflict:
                raise HTTPException(status_code=400, detail="Product ID already exists.")
        
        await db.products.insert_one(product_dict)
        
        # Add base images
        for idx, url in enumerate(product_data.image_urls):
            img_id = await get_next_id(db, "product_images")
            img = {
                "id": img_id,
                "product_id": new_id,
                "color_variant_id": None,
                "image_url": url,
                "is_primary": (idx == 0)
            }
            await db.product_images.insert_one(img)
        
        # Add color variants
        for variant_data in product_data.color_variants:
            v_id = await get_next_id(db, "product_color_variants")
            new_variant = {
                "id": v_id,
                "product_id": new_id,
                "color_name": variant_data.color_name,
                "color_code": variant_data.color_code,
                "stock": variant_data.stock,
                "is_active": variant_data.is_active,
                "show_in_carousel": variant_data.show_in_carousel,
                "created_at": datetime.utcnow()
            }
            await db.product_color_variants.insert_one(new_variant)
            
            # Add variant images
            for idx, img_data in enumerate(variant_data.images):
                img_id = await get_next_id(db, "product_images")
                variant_img = {
                    "id": img_id,
                    "product_id": new_id,
                    "color_variant_id": v_id,
                    "image_url": img_data.image_url,
                    "is_primary": img_data.is_primary or (idx == 0)
                }
                await db.product_images.insert_one(variant_img)
        
        await sync_main_to_excel(new_id, db)
        return await get_product(new_id, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create product: {str(e)}")

@router.put("/products/{product_id}", response_model=schemas.ProductResponse)
async def update_product(product_id: int, product_data: schemas.ProductCreate, db: Any = Depends(database.get_db), admin: Any = Depends(auth.get_admin)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if new slug conflicts
    if product["slug"] != product_data.slug:
        conflict = await db.products.find_one({"slug": product_data.slug})
        if conflict:
            import time
            product_data.slug = f"{product_data.slug}-{int(time.time())}"

    try:
        # Update basic fields
        update_dict = product_data.dict(exclude={'image_urls', 'color_variants'})
        
        if update_dict.get("product_id"):
            conflict = await db.products.find_one({"product_id": update_dict["product_id"], "id": {"$ne": product_id}})
            if conflict:
                raise HTTPException(status_code=400, detail="Product ID already exists.")
                
        await db.products.update_one({"id": product_id}, {"$set": update_dict})
        
        # Update base images if provided
        if product_data.image_urls is not None:
            # Delete old base images
            await db.product_images.delete_many({
                "product_id": product_id,
                "color_variant_id": None
            })
            
            # Add new ones
            for idx, url in enumerate(product_data.image_urls):
                img_id = await get_next_id(db, "product_images")
                img = {
                    "id": img_id,
                    "product_id": product_id,
                    "image_url": url,
                    "is_primary": (idx == 0),
                    "color_variant_id": None
                }
                await db.product_images.insert_one(img)

        await sync_main_to_excel(product_id, db)
        return await get_product(product_id, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update product: {str(e)}")

@router.delete("/products/{product_id}")
async def delete_product(product_id: int, db: Any = Depends(database.get_db), admin: Any = Depends(auth.get_admin)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.products.update_one({"id": product_id}, {"$set": {"is_active": False}})
    await sync_main_to_excel(product_id, db)
    return {"message": "Product deactivated successfully"}

# Categories
@router.get("/categories", response_model=List[schemas.CategoryResponse])
async def get_categories(db: Any = Depends(database.get_db)):
    cats = await db.categories.find().to_list(length=100)
    return strip_oid(cats)

@router.post("/categories", response_model=schemas.CategoryResponse)
async def create_category(cat_data: schemas.CategoryBase, db: Any = Depends(database.get_db), admin: Any = Depends(auth.get_admin)):
    # Initialize counter if not exists
    count_doc = await db.counters.find_one({"_id": "categories"})
    if not count_doc:
        max_cat = await db.categories.find_one(sort=[("id", -1)])
        start_val = max_cat.get("id", 0) if max_cat else 0
        await db.counters.update_one({"_id": "categories"}, {"$set": {"seq": start_val}}, upsert=True)

    new_id = await get_next_id(db, "categories")
    new_cat = cat_data.dict()
    new_cat["id"] = new_id
    await db.categories.insert_one(new_cat)
    return strip_oid(new_cat)

# Color Variants Management
@router.post("/products/{product_id}/variants", response_model=schemas.ProductColorVariantResponse)
async def add_color_variant(
    product_id: int, 
    variant_data: schemas.ProductColorVariantCreate, 
    db: Any = Depends(database.get_db), 
    admin: Any = Depends(auth.get_admin)
):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        # Initialize counter
        count_doc = await db.counters.find_one({"_id": "product_color_variants"})
        if not count_doc:
            max_v = await db.product_color_variants.find_one(sort=[("id", -1)])
            start_val = max_v.get("id", 0) if max_v else 0
            await db.counters.update_one({"_id": "product_color_variants"}, {"$set": {"seq": start_val}}, upsert=True)

        v_id = await get_next_id(db, "product_color_variants")
        new_variant = {
            "id": v_id,
            "product_id": product_id,
            "color_name": variant_data.color_name,
            "color_code": variant_data.color_code,
            "stock": variant_data.stock,
            "is_active": variant_data.is_active,
            "show_in_carousel": variant_data.show_in_carousel,
            "created_at": datetime.utcnow()
        }
        await db.product_color_variants.insert_one(new_variant)
        
        # Add variant images
        for idx, img_data in enumerate(variant_data.images):
            img_id = await get_next_id(db, "product_images")
            variant_img = {
                "id": img_id,
                "product_id": product_id,
                "color_variant_id": v_id,
                "image_url": img_data.image_url,
                "is_primary": img_data.is_primary or (idx == 0)
            }
            await db.product_images.insert_one(variant_img)
        
        # Return the variant with images
        res = await db.product_color_variants.find_one({"id": v_id})
        res["images"] = await db.product_images.find({"color_variant_id": v_id}).to_list(length=100)
        await sync_main_to_excel(product_id, db)
        return strip_oid(res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to add variant: {str(e)}")
@router.put("/products/{product_id}/variants/{variant_id}", response_model=schemas.ProductColorVariantResponse)
async def update_color_variant(
    product_id: int,
    variant_id: int,
    variant_data: schemas.ProductColorVariantCreate,
    db: Any = Depends(database.get_db),
    admin: Any = Depends(auth.get_admin)
):
    variant = await db.product_color_variants.find_one({"id": variant_id, "product_id": product_id})
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    try:
        update_data = {
            "color_name": variant_data.color_name,
            "color_code": variant_data.color_code,
            "stock": variant_data.stock,
            "is_active": variant_data.is_active,
            "show_in_carousel": variant_data.show_in_carousel
        }
        await db.product_color_variants.update_one({"id": variant_id}, {"$set": update_data})
        
        if variant_data.images:
            await db.product_images.delete_many({"color_variant_id": variant_id})
            for idx, img_data in enumerate(variant_data.images):
                img_id = await get_next_id(db, "product_images")
                variant_img = {
                    "id": img_id,
                    "product_id": product_id,
                    "color_variant_id": variant_id,
                    "image_url": img_data.image_url,
                    "is_primary": img_data.is_primary or (idx == 0)
                }
                await db.product_images.insert_one(variant_img)
        
        res = await db.product_color_variants.find_one({"id": variant_id})
        res["images"] = await db.product_images.find({"color_variant_id": variant_id}).to_list(length=100)
        await sync_main_to_excel(product_id, db)
        return strip_oid(res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update variant: {str(e)}")
@router.delete("/products/{product_id}/variants/{variant_id}")
async def delete_color_variant(
    product_id: int,
    variant_id: int,
    db: Any = Depends(database.get_db),
    admin: Any = Depends(auth.get_admin)
):
    variant = await db.product_color_variants.find_one({"id": variant_id, "product_id": product_id})
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    await db.product_color_variants.delete_one({"id": variant_id})
    await db.product_images.delete_many({"color_variant_id": variant_id})
    await sync_main_to_excel(product_id, db)
    return {"message": "Variant deleted successfully"}

# Related Products
@router.get("/products/{product_id}/related", response_model=schemas.ProductListResponse)
async def get_related_products(product_id: int, limit: int = 8, db: Any = Depends(database.get_db)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    category_id = product.get("category_id")
    filt = {"is_active": True, "id": {"$ne": product_id}}
    if category_id:
        filt["category_id"] = category_id

    items = await db.products.find(filt).limit(limit).to_list(length=limit)

    # If not enough from same category, pad with other active products
    if len(items) < limit:
        existing_ids = [p["id"] for p in items] + [product_id]
        extra = await db.products.find(
            {"is_active": True, "id": {"$nin": existing_ids}}
        ).limit(limit - len(items)).to_list(length=limit)
        items.extend(extra)

    populated = []
    for item in items:
        item["category"] = None
        if item.get("category_id"):
            cat = await db.categories.find_one({"id": item["category_id"]})
            if cat:
                item["category"] = strip_oid(cat)
        elif item.get("category"):
            item["category"] = {"id": None, "name": item.get("category"), "description": ""}

        item["images"] = await db.product_images.find(
            {"product_id": item["id"], "color_variant_id": None}
        ).to_list(length=100)

        variants = await db.product_color_variants.find({"product_id": item["id"]}).to_list(length=100)
        for v in variants:
            v["images"] = await db.product_images.find({"color_variant_id": v["id"]}).to_list(length=100)
        item["color_variants"] = variants
        populated.append(item)

    return {
        "items": strip_oid(populated),
        "total": len(populated),
        "page": 1,
        "page_size": limit,
        "pages": 1
    }


# Image Upload
@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), admin: Any = Depends(auth.get_admin)):
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Invalid file type.")
    
    try:
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)
        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=400, detail="File too large.")
    except Exception:
        raise HTTPException(status_code=500, detail="Could not validate file size")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    import uuid
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"image_url": f"/static/uploads/{unique_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")
