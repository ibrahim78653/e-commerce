"""
Database migration script to add carousel support for color variants
"""
from database import engine, SessionLocal
from sqlalchemy import text

def migrate_database():
    """Add show_in_carousel column to product_color_variants"""
    print("Starting database migration for variant carousel support...")
    
    db = SessionLocal()
    
    try:
        with engine.connect() as conn:
            # Add show_in_carousel to product_color_variants if it doesn't exist
            try:
                conn.execute(text("""
                    ALTER TABLE product_color_variants 
                    ADD COLUMN show_in_carousel BOOLEAN DEFAULT 0
                """))
                conn.commit()
                print("[OK] Added show_in_carousel to product_color_variants")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print("[OK] show_in_carousel already exists in product_color_variants")
                else:
                    print(f"Warning: {e}")
        
        print("\n[SUCCESS] Migration completed successfully!")
        
    except Exception as e:
        print(f"\n[ERROR] Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_database()
