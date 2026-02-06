from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import models, schemas, auth, database
from typing import List, Optional
import os
import shutil
from config import settings
import math

router = APIRouter(prefix="/api", tags=["Products"])

@router.get("/products", response_model=schemas.ProductListResponse)
def get_products(
    category_id: Optional[int] = None, 
    page: int = 1,
    page_size: int = 12,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    is_featured: Optional[bool] = None,
    is_active: Optional[bool] = None, # Allow filtering by status
    admin_view: bool = False, # Flag to override defaults for admin
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Product)
    
    if admin_view:
        # Admin view: filter by is_active only if specified, otherwise show all
        if is_active is not None:
            query = query.filter(models.Product.is_active == is_active)
    else:
        # Public view: default to active products only, unless explicitly filtering
        status_to_filter = is_active if is_active is not None else True
        query = query.filter(models.Product.is_active == status_to_filter)
    
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(models.Product.name.ilike(search_filter))
        
    if is_featured:
        query = query.filter(models.Product.is_featured == True)
        
    # Sorting
    if sort_by == "price":
        sort_attr = models.Product.original_price
    elif sort_by == "name":
        sort_attr = models.Product.name
    elif sort_by == "stock":
        sort_attr = models.Product.stock
    else:
        sort_attr = models.Product.id

    if sort_order == "desc":
        query = query.order_by(sort_attr.desc())
    else:
        query = query.order_by(sort_attr.asc())
        
    total = query.count()
    pages = math.ceil(total / page_size) if page_size > 0 else 1
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages
    }

@router.get("/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(database.get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/products", response_model=schemas.ProductResponse)
def create_product(product_data: schemas.ProductCreate, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_admin)):
    # Check if slug already exists
    existing_product = db.query(models.Product).filter(models.Product.slug == product_data.slug).first()
    if existing_product:
        # If slug exists, append some uniqueness
        import time
        product_data.slug = f"{product_data.slug}-{int(time.time())}"

    try:
        new_product = models.Product(
            name=product_data.name,
            slug=product_data.slug,
            description=product_data.description,
            original_price=product_data.original_price,
            discounted_price=product_data.discounted_price,
            stock=product_data.stock,
            category_id=product_data.category_id,
            is_featured=product_data.is_featured,
            is_active=product_data.is_active,
            short_description=product_data.short_description,
            sizes=product_data.sizes,
            colors=product_data.colors
        )
        db.add(new_product)
        db.flush() # Get the product ID
        
        # Add base images
        for idx, url in enumerate(product_data.image_urls):
            img = models.ProductImage(
                product_id=new_product.id, 
                image_url=url,
                is_primary=(idx == 0)
            )
            db.add(img)
        
        # Add color variants
        for variant_data in product_data.color_variants:
            new_variant = models.ProductColorVariant(
                product_id=new_product.id,
                color_name=variant_data.color_name,
                color_code=variant_data.color_code,
                stock=variant_data.stock,
                is_active=variant_data.is_active,
                show_in_carousel=variant_data.show_in_carousel
            )
            db.add(new_variant)
            db.flush()  # Get variant ID
            
            # Add variant images
            for idx, img_data in enumerate(variant_data.images):
                variant_img = models.ProductImage(
                    product_id=new_product.id,
                    color_variant_id=new_variant.id,
                    image_url=img_data.image_url,
                    is_primary=img_data.is_primary or (idx == 0)
                )
                db.add(variant_img)
        
        db.commit()
        db.refresh(new_product)
        return new_product
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create product: {str(e)}")

@router.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product_data: schemas.ProductCreate, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_admin)):
    print(f"DEBUG: START update_product for ID {product_id}")
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        print(f"DEBUG: Product {product_id} not found")
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if new slug conflicts with another product
    if product.slug != product_data.slug:
        conflict = db.query(models.Product).filter(models.Product.slug == product_data.slug).first()
        if conflict:
            print(f"DEBUG: Slug conflict for '{product_data.slug}', generating unique one")
            import time
            product_data.slug = f"{product_data.slug}-{int(time.time())}"

    try:
        # Update basic fields
        update_dict = product_data.dict(exclude={'image_urls', 'color_variants'})
        print(f"DEBUG: Updating fields: {update_dict}")
        
        for key, value in update_dict.items():
            if hasattr(product, key):
                setattr(product, key, value)
            else:
                print(f"WARNING: Field '{key}' not found in Product model, skipping")
        
        # Update base images if provided
        # We only update base images (those NOT associated with a variant)
        if product_data.image_urls is not None:
            print(f"DEBUG: Updating images with: {product_data.image_urls}")
            # Delete old base images
            db.query(models.ProductImage).filter(
                models.ProductImage.product_id == product_id,
                models.ProductImage.color_variant_id == None
            ).delete()
            
            # Add new ones
            for idx, url in enumerate(product_data.image_urls):
                img = models.ProductImage(
                    product_id=product_id,
                    image_url=url,
                    is_primary=(idx == 0)
                )
                db.add(img)

        db.commit()
        db.refresh(product)
        print(f"DEBUG: Successfully updated product {product_id}")
        return product
    except Exception as e:
        print(f"DEBUG: Update failed: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update product: {str(e)}")

@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_admin)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Soft delete
    product.is_active = False
    db.commit()
    return {"message": "Product deactivated successfully"}

# Categories
@router.get("/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(database.get_db)):
    return db.query(models.Category).all()

@router.post("/categories", response_model=schemas.CategoryResponse)
def create_category(cat_data: schemas.CategoryBase, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_admin)):
    new_cat = models.Category(**cat_data.dict())
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

# Color Variants Management
@router.post("/products/{product_id}/variants", response_model=schemas.ProductColorVariantResponse)
def add_color_variant(
    product_id: int, 
    variant_data: schemas.ProductColorVariantCreate, 
    db: Session = Depends(database.get_db), 
    admin: models.User = Depends(auth.get_admin)
):
    """Add a new color variant to an existing product"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        new_variant = models.ProductColorVariant(
            product_id=product_id,
            color_name=variant_data.color_name,
            color_code=variant_data.color_code,
            stock=variant_data.stock,
            is_active=variant_data.is_active,
            show_in_carousel=variant_data.show_in_carousel
        )
        db.add(new_variant)
        db.flush()
        
        # Add variant images
        for idx, img_data in enumerate(variant_data.images):
            variant_img = models.ProductImage(
                product_id=product_id,
                color_variant_id=new_variant.id,
                image_url=img_data.image_url,
                is_primary=img_data.is_primary or (idx == 0)
            )
            db.add(variant_img)
        
        db.commit()
        db.refresh(new_variant)
        return new_variant
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to add variant: {str(e)}")

@router.put("/products/{product_id}/variants/{variant_id}", response_model=schemas.ProductColorVariantResponse)
def update_color_variant(
    product_id: int,
    variant_id: int,
    variant_data: schemas.ProductColorVariantCreate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(auth.get_admin)
):
    """Update an existing color variant"""
    variant = db.query(models.ProductColorVariant).filter(
        models.ProductColorVariant.id == variant_id,
        models.ProductColorVariant.product_id == product_id
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    try:
        # Update variant fields
        variant.color_name = variant_data.color_name
        variant.color_code = variant_data.color_code
        variant.stock = variant_data.stock
        variant.is_active = variant_data.is_active
        variant.show_in_carousel = variant_data.show_in_carousel
        
        # Update images if provided
        if variant_data.images:
            # Remove old images
            db.query(models.ProductImage).filter(
                models.ProductImage.color_variant_id == variant_id
            ).delete()
            
            # Add new images
            for idx, img_data in enumerate(variant_data.images):
                variant_img = models.ProductImage(
                    product_id=product_id,
                    color_variant_id=variant_id,
                    image_url=img_data.image_url,
                    is_primary=img_data.is_primary or (idx == 0)
                )
                db.add(variant_img)
        
        db.commit()
        db.refresh(variant)
        return variant
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update variant: {str(e)}")

@router.delete("/products/{product_id}/variants/{variant_id}")
def delete_color_variant(
    product_id: int,
    variant_id: int,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(auth.get_admin)
):
    """Delete a color variant"""
    variant = db.query(models.ProductColorVariant).filter(
        models.ProductColorVariant.id == variant_id,
        models.ProductColorVariant.product_id == product_id
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    db.delete(variant)
    db.commit()
    return {"message": "Variant deleted successfully"}

# Image Upload
@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), admin: models.User = Depends(auth.get_admin)):
    # 1. Validate File Extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}"
        )
    
    # 2. Validate File Size
    # We need to read a bit to check size or use the file object's size if available
    # In newer FastAPI versions, UploadFile has a 'size' attribute. 
    # If not, we can check by seeking or tracking.
    try:
        # Seek to end to get size
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0) # Reset to beginning
        
        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB"
            )
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail="Could not validate file size")

    # 3. Save File
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Use a unique filename to prevent overwrites
    import uuid
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"image_url": f"/static/uploads/{unique_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")
