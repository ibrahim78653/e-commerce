import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from datetime import datetime

async def migrate_products():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    try:
        # Get all standard products
        products = await db.products.find({}).to_list(None)
        print(f"Found {len(products)} standard products.")
        
        migrated_count = 0
        for p in products:
            # Generate a product_id (e.g., PROD-001)
            p_id_int = p.get("id")
            pid = f"PROD-{str(p_id_int).zfill(3)}"
            
            # Check if it already exists in excel_products
            existing = await db.excel_products.find_one({"product_id": pid})
            if existing:
                print(f"Product {pid} already exists in excel_products. Skipping.")
                continue
                
            print(f"Migrating {p.get('name')} -> {pid}")
            
            # Map fields
            excel_product = {
                "product_id": pid,
                "product_name": p.get("name", ""),
                "original_price": p.get("original_price", 0),
                "discounted_price": p.get("discounted_price"),
                "description": p.get("description", ""),
                "is_active": p.get("is_active", True),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await db.excel_products.insert_one(excel_product)
            
            # Map colors
            colors_str = p.get("colors", "")
            if colors_str:
                colors = [c.strip() for c in colors_str.split(",") if c.strip()]
                for c in colors:
                    await db.excel_product_colors.insert_one({"product_id": pid, "color_name": c})
            
            # Map sizes
            sizes_str = p.get("sizes", "")
            if sizes_str:
                sizes = [s.strip() for s in sizes_str.split(",") if s.strip()]
                for s in sizes:
                    await db.excel_product_sizes.insert_one({"product_id": pid, "size_value": s})
                    
            # Map images
            images = await db.product_images.find({"product_id": p_id_int}).sort("id", 1).to_list(None)
            for idx, img in enumerate(images):
                await db.excel_product_images.insert_one({
                    "product_id": pid,
                    "image_url": img.get("image_url", ""),
                    "sort_order": idx
                })
                
            # Update the original product with product_id just in case
            await db.products.update_one({"id": p_id_int}, {"$set": {"product_id": pid}})
            
            migrated_count += 1
            
        print(f"Successfully migrated {migrated_count} products to excel_products collection.")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(migrate_products())
