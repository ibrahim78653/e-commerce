"""
Database Models with SQLAlchemy ORM
Complete schema for e-commerce platform
"""
from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, 
    DateTime, Boolean, Text, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base


# Enums for type safety
class OrderStatus(str, enum.Enum):
    """Order processing status"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentStatus(str, enum.Enum):
    """Payment transaction status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, enum.Enum):
    """Payment methods available"""
    RAZORPAY = "razorpay"
    WHATSAPP = "whatsapp"
    COD = "cod"  # Cash on Delivery


class UserRole(str, enum.Enum):
    """User roles for access control"""
    ADMIN = "admin"
    CUSTOMER = "customer"


# ==================== USER MODEL ====================
class User(Base):
    """
    User account model
    Supports authentication via email OR phone number
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Authentication fields - either email OR phone is required
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(20), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile information
    full_name = Column(String(255), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    
    # Verification status
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        identifier = self.email or self.phone
        return f"<User {identifier}>"


# ==================== CATEGORY MODEL ====================
class Category(Base):
    """Product categories for organization"""
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)  # URL-friendly name
    type = Column(String(50), nullable=True)  # Ladies, Gents, Kids, etc.
    description = Column(Text, nullable=True)
    
    # SEO fields
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    
    # Display order
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    products = relationship("Product", back_populates="category")
    
    def __repr__(self):
        return f"<Category {self.name}>"


# ==================== PRODUCT MODEL ====================
class Product(Base):
    """
    Product model with comprehensive fields
    Each product can have up to 3 images via ProductImage relationship
    """
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic information
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)
    
    # Pricing
    original_price = Column(Float, nullable=False)
    discounted_price = Column(Float, nullable=True)
    
    # Inventory
    stock = Column(Integer, default=0, nullable=False)
    sku = Column(String(100), unique=True, nullable=True)  # Stock Keeping Unit
    
    # Category relationship
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    subcategory = Column(String(100), nullable=True)
    
    # Product attributes (stored as comma-separated values)
    sizes = Column(String(255), nullable=True)  # e.g., "S,M,L,XL" or "32,34,36"
    colors = Column(String(255), nullable=True)  # e.g., "Red,Blue,Green"
    material = Column(String(100), nullable=True)
    
    # SEO fields
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    meta_keywords = Column(String(255), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.display_order")
    order_items = relationship("OrderItem", back_populates="product")
    
    def __repr__(self):
        return f"<Product {self.name}>"


# ==================== PRODUCT IMAGE MODEL ====================
class ProductImage(Base):
    """
    Product images - each product has exactly 3 images
    Images are ordered by display_order field
    """
    __tablename__ = "product_images"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Image information
    image_url = Column(String(500), nullable=False)  # Path to image file
    alt_text = Column(String(255), nullable=True)  # Accessibility text
    display_order = Column(Integer, default=0, nullable=False)  # 0, 1, 2 for the 3 images
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    product = relationship("Product", back_populates="images")
    
    def __repr__(self):
        return f"<ProductImage {self.id} for Product {self.product_id}>"


# ==================== ORDER MODEL ====================
class Order(Base):
    """
    Order model tracking customer purchases
    """
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User relationship (nullable for guest checkout, if implemented)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Customer information (stored even if user is logged in for historical record)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=True)
    customer_phone = Column(String(20), nullable=False)
    
    # Shipping address
    shipping_address = Column(Text, nullable=False)
    shipping_city = Column(String(100), nullable=True)
    shipping_state = Column(String(100), nullable=True)
    shipping_pincode = Column(String(20), nullable=True)
    
    # Order details
    total_amount = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    final_amount = Column(Float, nullable=False)
    
    # Order status
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    
    # Notes
    customer_notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    confirmed_at = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order {self.id} - {self.status.value}>"


# ==================== ORDER ITEM MODEL ====================
class OrderItem(Base):
    """
    Individual items within an order
    """
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Product snapshot at time of order
    product_name = Column(String(255), nullable=False)  # Store name in case product is deleted
    product_sku = Column(String(100), nullable=True)
    
    # Variant information
    selected_size = Column(String(50), nullable=True)
    selected_color = Column(String(50), nullable=True)
    
    # Pricing
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    
    def __repr__(self):
        return f"<OrderItem {self.product_name} x{self.quantity}>"


# ==================== PAYMENT MODEL ====================
class Payment(Base):
    """
    Payment transaction records
    One payment per order (one-to-one relationship)
    """
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    
    # Payment gateway details
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    
    # Razorpay specific fields
    razorpay_order_id = Column(String(100), unique=True, nullable=True)
    razorpay_payment_id = Column(String(100), unique=True, nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    
    # Transaction details
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    
    # Payment gateway response (store as JSON string if needed)
    transaction_response = Column(Text, nullable=True)
    
    # Failure handling
    failure_reason = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    order = relationship("Order", back_populates="payment")
    
    def __repr__(self):
        return f"<Payment {self.id} - {self.payment_status.value}>"


# ==================== REFRESH TOKEN MODEL ====================
class RefreshToken(Base):
    """
    Store refresh tokens for JWT authentication
    Allows token invalidation on logout
    """
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    token = Column(String(500), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    
    # Track token usage
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<RefreshToken {self.id} for User {self.user_id}>"
