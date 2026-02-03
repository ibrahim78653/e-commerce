"""
Pydantic schemas for request/response validation
Type-safe data validation with FastAPI
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional
from datetime import datetime
from enum import Enum


# ==================== ENUMS ====================
class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentMethod(str, Enum):
    RAZORPAY = "razorpay"
    WHATSAPP = "whatsapp"
    COD = "cod"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


# ==================== USER SCHEMAS ====================
class UserRegister(BaseModel):
    """User registration - requires either email OR phone"""
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    
    @validator('phone')
    def validate_phone(cls, v):
        if v:
            # Remove spaces and validate digits
            cleaned = v.replace(" ", "").replace("-", "")
            if not cleaned.isdigit():
                raise ValueError('Phone number must contain only digits')
            if len(cleaned) < 10:
                raise ValueError('Phone number must be at least 10 digits')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123",
                "full_name": "John Doe"
            }
        }


class UserLogin(BaseModel):
    """User login - accepts email OR phone"""
    identifier: str = Field(..., description="Email or phone number")
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "identifier": "user@example.com",
                "password": "SecurePass123"
            }
        }


class UserResponse(BaseModel):
    """User profile response"""
    id: int
    email: Optional[str]
    phone: Optional[str]
    full_name: Optional[str]
    role: str
    email_verified: bool
    phone_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenRefresh(BaseModel):
    """Refresh token request"""
    refresh_token: str


class PasswordChange(BaseModel):
    """Password change request"""
    old_password: str
    new_password: str = Field(..., min_length=8)


# ==================== CATEGORY SCHEMAS ====================
class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    type: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    slug: str = Field(..., max_length=100)


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== PRODUCT IMAGE SCHEMAS ====================
class ProductImageBase(BaseModel):
    image_url: str
    alt_text: Optional[str] = None
    display_order: int = 0


class ProductImageResponse(ProductImageBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== PRODUCT SCHEMAS ====================
class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=500)
    original_price: float = Field(..., gt=0)
    discounted_price: Optional[float] = Field(None, ge=0)
    stock: int = Field(default=0, ge=0)
    category_id: Optional[int] = None
    subcategory: Optional[str] = None
    sizes: Optional[str] = None  # Comma-separated
    colors: Optional[str] = None  # Comma-separated
    material: Optional[str] = None
    is_featured: bool = False


class ProductCreate(ProductBase):
    """Product creation with image URLs"""
    image_urls: List[str] = Field(..., min_length=1, max_length=3)


class ProductUpdate(BaseModel):
    """Product update - all fields optional"""
    name: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    original_price: Optional[float] = Field(None, gt=0)
    discounted_price: Optional[float] = Field(None, ge=0)
    stock: Optional[int] = Field(None, ge=0)
    category_id: Optional[int] = None
    subcategory: Optional[str] = None
    sizes: Optional[str] = None
    colors: Optional[str] = None
    material: Optional[str] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    sku: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse]
    images: List[ProductImageResponse] = []
    
    @validator('images')
    def ensure_three_images(cls, v):
        """Ensure we always return 3 images (fill with placeholders if needed)"""
        while len(v) < 3:
            v.append(ProductImageResponse(
                id=0,
                image_url="/static/placeholder.jpg",
                alt_text="Product image",
                display_order=len(v),
                created_at=datetime.utcnow()
            ))
        return v[:3]  # Limit to 3 images
    
    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    """Paginated product list"""
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ==================== ORDER ITEM SCHEMAS ====================
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    selected_size: Optional[str] = None
    selected_color: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    selected_size: Optional[str]
    selected_color: Optional[str]
    unit_price: float
    quantity: int
    total_price: float
    
    class Config:
        from_attributes = True


# ==================== ORDER SCHEMAS ====================
class OrderCreate(BaseModel):
    """Create new order"""
    customer_name: str = Field(..., max_length=255)
    customer_email: Optional[EmailStr] = None
    customer_phone: str = Field(..., min_length=10, max_length=20)
    shipping_address: str
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_pincode: Optional[str] = None
    payment_method: PaymentMethod
    customer_notes: Optional[str] = None
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: Optional[str]
    customer_phone: str
    shipping_address: str
    total_amount: float
    final_amount: float
    status: OrderStatus
    payment_method: PaymentMethod
    created_at: datetime
    items: List[OrderItemResponse]
    
    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    """Update order status"""
    status: OrderStatus


# ==================== PAYMENT SCHEMAS ====================
class RazorpayOrderCreate(BaseModel):
    """Request to create Razorpay order"""
    order_id: int
    amount: float


class RazorpayOrderResponse(BaseModel):
    """Razorpay order creation response"""
    razorpay_order_id: str
    amount: float
    currency: str
    key_id: str  # Public key for frontend


class RazorpayPaymentVerify(BaseModel):
    """Verify Razorpay payment"""
    order_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentResponse(BaseModel):
    """Payment details"""
    id: int
    order_id: int
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    amount: float
    razorpay_order_id: Optional[str]
    razorpay_payment_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== WHATSAPP ORDER SCHEMAS ====================
class WhatsAppOrderCreate(BaseModel):
    """Create order via WhatsApp"""
    customer_name: str
    customer_phone: str
    shipping_address: str
    items: List[OrderItemCreate]


class WhatsAppOrderResponse(BaseModel):
    """WhatsApp order response with pre-filled message URL"""
    order_id: int
    whatsapp_url: str
    message: str


# ==================== PAGINATION SCHEMAS ====================
class PaginationParams(BaseModel):
    """Common pagination parameters"""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    search: Optional[str] = None
    sort_by: Optional[str] = "created_at"
    sort_order: Optional[str] = "desc"  # asc or desc


# ==================== IMAGE UPLOAD SCHEMAS ====================
class ImageUploadResponse(BaseModel):
    """Image upload response"""
    filename: str
    url: str
    size: int


# ==================== STANDARD RESPONSES ====================
class MessageResponse(BaseModel):
    """Standard message response"""
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Standard error response"""
    detail: str
    error_code: Optional[str] = None
