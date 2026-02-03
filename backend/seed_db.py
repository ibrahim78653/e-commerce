"""
Database Seeding Script
Run this to populate the database with sample data
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from models import User, Category, Product, ProductImage
from auth import get_password_hash
from datetime import datetime

def seed_database():
    """Seed database with sample data"""
    print("Initializing database...")
    init_db()
    
    db: Session = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(User).first():
            print("Database already has data. Skipping seed.")
            return
        
        print("Creating users...")
        # Create admin user
        admin = User(
            email="admin@burhani.com",
            phone="9876543210",
            hashed_password=get_password_hash("Admin@123"),
            full_name="Admin User",
            role="admin",
            is_active=True,
            email_verified=True,
            phone_verified=True
        )
        db.add(admin)
        
        # Create sample customer
        customer = User(
            email="customer@example.com",
            phone="9876543211",
            hashed_password=get_password_hash("Customer@123"),
            full_name="Sample Customer",
            role="customer",
            is_active=True,
            email_verified=True
        )
        db.add(customer)
        db.commit()
        print("Created 2 users (admin and customer)")
        
        print("\nCreating categories...")
        categories_data = [
            {"name": "Ladies Wear", "slug": "ladies-wear", "type": "ladies", "description": "Fashion for women"},
            {"name": "Gents Wear", "slug": "gents-wear", "type": "gents", "description": "Fashion for men"},
            {"name": "Kids Wear", "slug": "kids-wear", "type": "kids", "description": "Fashion for children"},
            {"name": "Accessories", "slug": "accessories", "type": "accessories", "description": "Fashion accessories"},
        ]
        
        categories = []
        for cat_data in categories_data:
            category = Category(**cat_data)
            db.add(category)
            categories.append(category)
        
        db.commit()
        print(f"Created {len(categories)} categories")
        
        print("\nCreating sample products...")
        products_data = [
            {
                "name": "Elegant Saree",
                "slug": "elegant-saree",
                "short_description": "Beautiful traditional saree",
                "description": "Elegant saree perfect for special occasions. Made with premium fabric.",
                "original_price": 2999.00,
                "discounted_price": 2499.00,
                "stock": 50,
                "category_id": categories[0].id,
                "sizes": "Free Size",
                "colors": "Red, Blue, Green",
                "material": "Silk",
                "is_featured": True,
                "sku": "SAR001"
            },
            {
                "name": "Designer Kurta",
                "slug": "designer-kurta",
                "short_description": "Premium cotton kurta",
                "description": "Comfortable and stylish kurta for everyday wear.",
                "original_price": 1499.00,
                "discounted_price": 1199.00,
                "stock": 100,
                "category_id": categories[1].id,
                "sizes": "M, L, XL, XXL",
                "colors": "White, Black, Navy",
                "material": "Cotton",
                "is_featured": True,
                "sku": "KUR001"
            },
            {
                "name": "Kids Dress",
                "slug": "kids-dress",
                "short_description": "Adorable dress for kids",
                "description": "Cute and comfortable dress for your little ones.",
                "original_price": 899.00,
                "discounted_price": 699.00,
                "stock": 75,
                "category_id": categories[2].id,
                "sizes": "2-3Y, 4-5Y, 6-7Y",
                "colors": "Pink, Yellow, Purple",
                "material": "Cotton Blend",
                "is_featured": False,
                "sku": "KID001"
            },
            {
                "name": "Formal Shirt",
                "slug": "formal-shirt",
                "short_description": "Classic formal shirt",
                "description": "Perfect formal shirt for office and events.",
                "original_price": 1299.00,
                "stock": 80,
                "category_id": categories[1].id,
                "sizes": "S, M, L, XL",
                "colors": "White, Blue, Black",
                "material": "Cotton",
                "is_featured": False,
                "sku": "SHR001"
            },
            {
                "name": "Party Wear Lehenga",
                "slug": "party-wear-lehenga",
                "short_description": "Stunning lehenga for parties",
                "description": "Beautiful embroidered lehenga perfect for weddings and parties.",
                "original_price": 4999.00,
                "discounted_price": 3999.00,
                "stock": 25,
                "category_id": categories[0].id,
                "sizes": "S, M, L",
                "colors": "Maroon, Gold, Pink",
                "material": "Georgette",
                "is_featured": True,
                "sku": "LEH001"
            },
            {
                "name": "Casual T-Shirt",
                "slug": "casual-t-shirt",
                "short_description": "Comfortable casual tee",
                "description": "Soft and comfortable t-shirt for daily wear.",
                "original_price": 499.00,
                "discounted_price": 399.00,
                "stock": 200,
                "category_id": categories[1].id,
                "sizes": "S, M, L, XL, XXL",
                "colors": "Black, White, Grey, Navy, Red",
                "material": "Cotton",
                "is_featured": False,
                "sku": "TSH001"
            },
        ]
        
        for prod_data in products_data:
            product = Product(**prod_data)
            db.add(product)
        
        db.commit()
        print(f"Created {len(products_data)} sample products")
        
        print("="*50)
        print("Database seeded successfully!")
        print("="*50)
        print("\nTest Credentials:")
        print("\nAdmin Account:")
        print("  Email: admin@burhani.com")
        print("  Phone: 9876543210")
        print("  Password: Admin@123")
        print("\nCustomer Account:")
        print("  Email: customer@example.com")
        print("  Phone: 9876543211")
        print("  Password: Customer@123")
        print("\n" + "="*50)
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
