from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Auth
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None

class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    identifier: str
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenRefresh(BaseModel):
    refresh_token: str

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

# Products & Categories
class CategoryBase(BaseModel):
    name: str
    slug: str

class CategoryResponse(CategoryBase):
    id: int
    class Config:
        from_attributes = True

class ProductImageSchema(BaseModel):
    id: Optional[int] = None
    image_url: str
    color_variant_id: Optional[int] = None
    is_primary: bool = False
    class Config:
        from_attributes = True

class ColorVariantImageCreate(BaseModel):
    image_url: str
    is_primary: bool = False

class ProductColorVariantCreate(BaseModel):
    color_name: str
    color_code: Optional[str] = None
    stock: int = 0
    is_active: bool = True
    show_in_carousel: bool = False
    images: List[ColorVariantImageCreate] = []

class ProductColorVariantResponse(BaseModel):
    id: int
    color_name: str
    color_code: Optional[str] = None
    stock: int
    is_active: bool
    show_in_carousel: bool
    images: List[ProductImageSchema] = []
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    original_price: float
    discounted_price: Optional[float] = None
    stock: int = 0
    category_id: Optional[int] = None
    is_featured: bool = False
    is_active: bool = True
    short_description: Optional[str] = None
    sizes: Optional[str] = None
    colors: Optional[str] = None

class ProductCreate(ProductBase):
    image_urls: List[str] = []
    color_variants: List[ProductColorVariantCreate] = []

class ProductResponse(ProductBase):
    id: int
    category: Optional[CategoryResponse]
    images: List[ProductImageSchema] = []
    color_variants: List[ProductColorVariantResponse] = []
    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    pages: int

# Orders
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    color_variant_id: Optional[int] = None
    selected_color: Optional[str] = None
    selected_size: Optional[str] = None

class OrderItemResponse(BaseModel):
    product_id: int
    product_name: str
    price: float
    quantity: int
    selected_color: Optional[str] = None
    selected_size: Optional[str] = None
    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: str
    shipping_address: str
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_pincode: Optional[str] = None
    payment_method: str
    items: List[OrderItemCreate]

class OrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: str
    address: str
    total_amount: float
    status: str
    payment_method: str
    created_at: datetime
    items: List[OrderItemResponse]
    class Config:
        from_attributes = True

# Razorpay
class RazorpayOrderCreate(BaseModel):
    order_id: int
    amount: float

class RazorpayOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: float
    currency: str
    key_id: str

class RazorpayPaymentVerify(BaseModel):
    order_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# WhatsApp
class WhatsAppOrderCreate(BaseModel):
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: str
    shipping_address: str
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_pincode: Optional[str] = None
    items: List[OrderItemCreate]

class WhatsAppOrderResponse(BaseModel):
    order_id: int
    whatsapp_url: str
    message: str

# Common
class MessageResponse(BaseModel):
    message: str
