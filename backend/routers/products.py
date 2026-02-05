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
        
        # Add images
        for url in product_data.image_urls:
            img = models.ProductImage(product_id=new_product.id, image_url=url)
            db.add(img)
        
        db.commit()
        db.refresh(new_product)
        return new_product
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create product: {str(e)}")

@router.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product_data: schemas.ProductBase, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_admin)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product_data.dict(exclude_unset=True).items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product

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

# Image Upload
@router.post("/upload/image")
def upload_image(file: UploadFile = File(...), admin: models.User = Depends(auth.get_admin)):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"image_url": f"/static/uploads/{file.filename}"}
