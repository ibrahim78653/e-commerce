"""
Product management API endpoints
Handles product CRUD, categories, search, and image upload
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
import os
import uuid
import shutil
from pathlib import Path

import models, schemas, auth, database
from config import settings

router = APIRouter(prefix="/api", tags=["Products"])


# ==================== CATEGORY ENDPOINTS ====================
@router.get("/categories", response_model=List[schemas.CategoryResponse])
async def get_categories(
    db: Session = Depends(database.get_db),
    active_only: bool = True
):
    """Get all categories"""
    query = db.query(models.Category)
    if active_only:
        query = query.filter(models.Category.is_active == True)
    return query.order_by(models.Category.display_order).all()


@router.post("/categories", response_model=schemas.CategoryResponse)
async def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Create new category (admin only)"""
    # Check if slug already exists
    existing = db.query(models.Category).filter(
        models.Category.slug == category.slug
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this slug already exists"
        )
    
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


# ==================== PRODUCT ENDPOINTS ====================
@router.get("/products", response_model=schemas.ProductListResponse)
async def get_products(
    db: Session = Depends(database.get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    sort_by: str = Query("created_at", regex="^(created_at|price|name|stock)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    is_featured: Optional[bool] = None,
    active_only: bool = True
):
    """
    Get paginated product list with search, filters, and sorting
    """
    query = db.query(models.Product)
    
    # Filter by active status
    if active_only:
        query = query.filter(models.Product.is_active == True)
    
    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Product.name.ilike(search_term),
                models.Product.description.ilike(search_term),
                models.Product.short_description.ilike(search_term)
            )
        )
    
    # Category filter
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    
    # Featured filter
    if is_featured is not None:
        query = query.filter(models.Product.is_featured == is_featured)
    
    # Sorting
    if sort_by == "price":
        sort_column = models.Product.discounted_price
    elif sort_by == "name":
        sort_column = models.Product.name
    elif sort_by == "stock":
        sort_column = models.Product.stock
    else:
        sort_column = models.Product.created_at
    
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Get total count
    total = query.count()
    
    # Pagination
    offset = (page - 1) * page_size
    products = query.offset(offset).limit(page_size).all()
    
    # Calculate total pages
    pages = (total + page_size - 1) // page_size
    
    return schemas.ProductListResponse(
        items=products,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.get("/products/{product_id}", response_model=schemas.ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(database.get_db)
):
    """Get single product by ID"""
    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return product


@router.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Create new product with images (admin only)"""
    # Check if slug already exists
    existing = db.query(models.Product).filter(
        models.Product.slug == product.slug
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product with this slug already exists"
        )
    
    # Validate image count (1-3 images)
    if not product.image_urls or len(product.image_urls) < 1 or len(product.image_urls) > 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product must have between 1 and 3 images"
        )
    
    # Generate SKU if not provided
    product_data = product.dict(exclude={"image_urls"})
    if not product_data.get("sku"):
        product_data["sku"] = f"PROD-{uuid.uuid4().hex[:8].upper()}"
    
    # Create product
    db_product = models.Product(**product_data)
    db.add(db_product)
    db.flush()  # Get product.id without committing
    
    # Create product images
    for idx, image_url in enumerate(product.image_urls):
        product_image = models.ProductImage(
            product_id=db_product.id,
            image_url=image_url,
            alt_text=f"{product.name} - Image {idx + 1}",
            display_order=idx
        )
        db.add(product_image)
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/products/{product_id}", response_model=schemas.ProductResponse)
async def update_product(
    product_id: int,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Update product (admin only)"""
    db_product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()
    
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Update fields
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/products/{product_id}", response_model=schemas.MessageResponse)
async def delete_product(
    product_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Soft delete product (admin only)"""
    db_product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()
    
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Soft delete - set is_active to False
    db_product.is_active = False
    db.commit()
    
    return schemas.MessageResponse(message="Product deleted successfully")


# ==================== IMAGE UPLOAD ====================
@router.post("/upload/image", response_model=schemas.ImageUploadResponse)
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """
    Upload product image (admin only)
    Returns URL to be used in product creation
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}"
        )
    
    # Create upload directory if it doesn't exist
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = upload_dir / unique_filename
    
    # Save file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    finally:
        file.file.close()
    
    # Get file size
    file_size = file_path.stat().st_size
    
    # Validate file size
    if file_size > settings.MAX_UPLOAD_SIZE:
        file_path.unlink()  # Delete file
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum limit of {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB"
        )
    
    # Return URL
    image_url = f"/static/uploads/{unique_filename}"
    
    return schemas.ImageUploadResponse(
        filename=unique_filename,
        url=image_url,
        size=file_size
    )
