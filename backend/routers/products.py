from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import schemas, auth, database
from typing import List, Optional, Any
import os
import shutil
from config import settings
import math

router = APIRouter(prefix="/api", tags=["Products"])

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
    
    print(f"DEBUG: filt={filt}")
    total = await db.products.count_documents(filt)
    print(f"DEBUG: total found={total}")
    pages = math.ceil(total / page_size) if page_size > 0 else 1
    offset = (page - 1) * page_size
    
    cursor = db.products.find(filt).sort(sort_field, direction).skip(offset).limit(page_size)
    items = await cursor.to_list(length=page_size)
    print(f"DEBUG: items fetched={len(items)}")

    # Fetch categories, images, and variants for these products
    # This is a bit more manual in MongoDB
    populated_items = []
    for item in items:
        # Category
        if item.get("category_id"):
            item["category"] = await db.categories.find_one({"id": item["category_id"]})
        
        # Images (base images have color_variant_id = None or null)
        item["images"] = await db.product_images.find({"product_id": item["id"], "color_variant_id": None}).to_list(length=100)
        
        # Color Variants
        variants = await db.product_color_variants.find({"product_id": item["id"]}).to_list(length=100)
        for v in variants:
            v["images"] = await db.product_images.find({"color_variant_id": v["id"]}).to_list(length=100)
        item["color_variants"] = variants
        
        populated_items.append(item)

    return {
        "items": populated_items,
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
    
    # Populate relationships
    if product.get("category_id"):
        product["category"] = await db.categories.find_one({"id": product["category_id"]})
    
    product["images"] = await db.product_images.find({"product_id": product_id, "color_variant_id": None}).to_list(length=100)
    
    variants = await db.product_color_variants.find({"product_id": product_id}).to_list(length=100)
    for v in variants:
        v["images"] = await db.product_images.find({"color_variant_id": v["id"]}).to_list(length=100)
    product["color_variants"] = variants
    
    return product

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
            start_val = max_prod["id"] if max_prod else 0
            await db.counters.update_one({"_id": "products"}, {"$set": {"seq": start_val}}, upsert=True)

        new_id = await get_next_id(db, "products")
        
        product_dict = product_data.dict(exclude={'image_urls', 'color_variants'})
        product_dict["id"] = new_id
        
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

        return await get_product(product_id, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update product: {str(e)}")

@router.delete("/products/{product_id}")
async def delete_product(product_id: int, db: Any = Depends(database.get_db), admin: Any = Depends(auth.get_admin)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.products.update_one({"id": product_id}, {"$set": {"is_active": False}})
    return {"message": "Product deactivated successfully"}

# Categories
@router.get("/categories", response_model=List[schemas.CategoryResponse])
async def get_categories(db: Any = Depends(database.get_db)):
    return await db.categories.find().to_list(length=100)

@router.post("/categories", response_model=schemas.CategoryResponse)
async def create_category(cat_data: schemas.CategoryBase, db: Any = Depends(database.get_db), admin: Any = Depends(auth.get_admin)):
    # Initialize counter if not exists
    count_doc = await db.counters.find_one({"_id": "categories"})
    if not count_doc:
        max_cat = await db.categories.find_one(sort=[("id", -1)])
        start_val = max_cat["id"] if max_cat else 0
        await db.counters.update_one({"_id": "categories"}, {"$set": {"seq": start_val}}, upsert=True)

    new_id = await get_next_id(db, "categories")
    new_cat = cat_data.dict()
    new_cat["id"] = new_id
    await db.categories.insert_one(new_cat)
    return new_cat

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
            start_val = max_v["id"] if max_v else 0
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
        return res
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
        return res
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
    return {"message": "Variant deleted successfully"}

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
from datetime import datetime
