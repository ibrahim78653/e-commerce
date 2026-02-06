"""
Database migration script to add color variant support
Run this script to update the database schema
"""
from database import engine, Base, SessionLocal
from sqlalchemy import text
import models

def migrate_database():
    """Add color variant tables and update existing tables"""
    print("Starting database migration for color variants...")
    
    db = SessionLocal()
    
    try:
        # Create new tables
        print("Creating new tables...")
        Base.metadata.create_all(bind=engine)
        
        # Add new columns to existing tables using raw SQL
        print("Adding new columns to existing tables...")
        
        # Check if columns exist before adding them
        with engine.connect() as conn:
            # Add columns to product_images if they don't exist
            try:
                conn.execute(text("""
                    ALTER TABLE product_images 
                    ADD COLUMN color_variant_id INTEGER REFERENCES product_color_variants(id)
                """))
                conn.commit()
                print("[OK] Added color_variant_id to product_images")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("[OK] color_variant_id already exists in product_images")
                else:
                    print(f"Warning: {e}")
            
            try:
                conn.execute(text("""
                    ALTER TABLE product_images 
                    ADD COLUMN is_primary BOOLEAN DEFAULT 0
                """))
                conn.commit()
                print("[OK] Added is_primary to product_images")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("[OK] is_primary already exists in product_images")
                else:
                    print(f"Warning: {e}")
            
            # Add columns to order_items if they don't exist
            try:
                conn.execute(text("""
                    ALTER TABLE order_items 
                    ADD COLUMN color_variant_id INTEGER REFERENCES product_color_variants(id)
                """))
                conn.commit()
                print("[OK] Added color_variant_id to order_items")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("[OK] color_variant_id already exists in order_items")
                else:
                    print(f"Warning: {e}")
            
            try:
                conn.execute(text("""
                    ALTER TABLE order_items 
                    ADD COLUMN selected_color TEXT
                """))
                conn.commit()
                print("[OK] Added selected_color to order_items")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("[OK] selected_color already exists in order_items")
                else:
                    print(f"Warning: {e}")
            
            try:
                conn.execute(text("""
                    ALTER TABLE order_items 
                    ADD COLUMN selected_size TEXT
                """))
                conn.commit()
                print("[OK] Added selected_size to order_items")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("[OK] Added selected_size to order_items")
        
        print("\n[SUCCESS] Migration completed successfully!")
        print("\nNext steps:")
        print("1. Restart your backend server")
        print("2. Test creating products with color variants")
        print("3. Check the admin dashboard for variant management")
        
    except Exception as e:
        print(f"\n[ERROR] Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_database()
