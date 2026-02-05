from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from models import User, Category, Product, ProductImage
from auth import get_password_hash
from datetime import datetime
import os

def seed_database():
    print("Initializing database...")
    init_db()
    db: Session = SessionLocal()
    
    try:
        # Create admin user
        if not db.query(User).filter(User.email == "admin@burhani.com").first():
            admin = User(
                email="admin@burhani.com",
                phone="9876543210",
                hashed_password=get_password_hash("Admin@123"),
                full_name="Admin User",
                role="admin"
            )
            db.add(admin)
            print("Admin user created.")

        # Create categories
        if not db.query(Category).first():
            cats = [
                Category(name="Ladies Wear", slug="ladies-wear"),
                Category(name="Gents Wear", slug="gents-wear"),
                Category(name="Kids Wear", slug="kids-wear"),
                Category(name="Accessories", slug="accessories")
            ]
            db.add_all(cats)
            db.flush()
            
            # Create products
            p1 = Product(
                name="Elegant Saree", 
                slug="elegant-saree", 
                description="Silk saree perfect for weddings.",
                short_description="Premium Silk Saree",
                original_price=2999.00, 
                discounted_price=2499.00, 
                stock=50, 
                category_id=cats[0].id,
                is_featured=True,
                sizes="Free Size",
                colors="Red, Gold"
            )
            p2 = Product(
                name="Designer Kurta", 
                slug="designer-kurta", 
                description="Cotton kurta for summer.",
                short_description="Comfortable Cotton Kurta",
                original_price=1499.00, 
                discounted_price=1199.00, 
                stock=100, 
                category_id=cats[1].id,
                is_featured=True,
                sizes="S, M, L, XL",
                colors="White, Blue"
            )
            p3 = Product(
                name="Kids Party Dress", 
                slug="kids-party-dress", 
                description="Cute dress for little ones.",
                short_description="Party Wear",
                original_price=999.00, 
                discounted_price=799.00, 
                stock=30, 
                category_id=cats[2].id,
                sizes="2-3Y, 4-5Y",
                colors="Pink"
            )

            db.add_all([p1, p2, p3])
            db.flush()
            
            # Images
            db.add(ProductImage(product_id=p1.id, image_url="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500"))
            db.add(ProductImage(product_id=p2.id, image_url="https://images.unsplash.com/photo-1598582236531-9252c8034d6c?w=500"))
            db.add(ProductImage(product_id=p3.id, image_url="https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500"))
            
            print("Categories and products seeded.")

        db.commit()
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
