from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="customer")
    is_active = Column(Boolean, default=True) # Used for blocking users
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    slug = Column(String, unique=True, index=True)
    
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    slug = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    short_description = Column(String, nullable=True)
    
    original_price = Column(Float)
    discounted_price = Column(Float, nullable=True)
    
    stock = Column(Integer, default=0)
    category_id = Column(Integer, ForeignKey("categories.id"))
    
    is_featured = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True) # Soft delete / Status
    
    sizes = Column(String, nullable=True)
    colors = Column(String, nullable=True)
    
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    color_variants = relationship("ProductColorVariant", back_populates="product", cascade="all, delete-orphan")

class ProductColorVariant(Base):
    """
    Color variants for products - each variant has its own stock and images
    """
    __tablename__ = "product_color_variants"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    color_name = Column(String)  # e.g., "Red", "Blue", "Black"
    color_code = Column(String, nullable=True)  # Hex code for display, e.g., "#FF0000"
    stock = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    show_in_carousel = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product", back_populates="color_variants")
    images = relationship("ProductImage", back_populates="color_variant", cascade="all, delete-orphan")

class ProductImage(Base):
    __tablename__ = "product_images"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    color_variant_id = Column(Integer, ForeignKey("product_color_variants.id"), nullable=True)
    image_url = Column(String)
    is_primary = Column(Boolean, default=False)  # Primary image for the variant/product
    
    product = relationship("Product", back_populates="images")
    color_variant = relationship("ProductColorVariant", back_populates="images")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String)
    customer_email = Column(String)
    customer_phone = Column(String)
    address = Column(Text)
    total_amount = Column(Float)
    status = Column(String, default="pending")
    payment_method = Column(String)
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    color_variant_id = Column(Integer, ForeignKey("product_color_variants.id"), nullable=True)
    product_name = Column(String)
    selected_color = Column(String, nullable=True)  # Store color name for reference
    selected_size = Column(String, nullable=True)  # Store size for reference
    price = Column(Float)
    quantity = Column(Integer)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    color_variant = relationship("ProductColorVariant")
