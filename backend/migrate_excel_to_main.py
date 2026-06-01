import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from datetime import datetime

async def get_next_id(db, collection_name: str):
    res = await db.counters.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return res["seq"]

async def migrate_products():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    try:
        # Get all excel products
        excel_products = await db.excel_products.find({}).to_list(None)
        print(f"Found {len(excel_products)} excel products.")
        
        migrated_count = 0
        for ep in excel_products:
            pid = ep.get("product_id")
            
            # Check if it already exists in products
            existing = await db.products.find_one({"product_id": pid})
            if existing:
                print(f"Product {pid} already exists in main products catalog. Updating...")
                
                colors_docs = await db.excel_product_colors.find({"product_id": pid}).to_list(100)
                sizes_docs = await db.excel_product_sizes.find({"product_id": pid}).to_list(100)
                
                colors_str = ",".join(c["color_name"] for c in colors_docs)
                sizes_str = ",".join(s["size_value"] for s in sizes_docs)
                
                update_fields = {
                    "name": ep.get("product_name", ""),
                    "original_price": float(ep.get("original_price", 0) or 0),
                    "discounted_price": ep.get("discounted_price"),
                    "description": ep.get("description", ""),
                    "is_active": ep.get("is_active", True),
                    "colors": colors_str,
                    "sizes": sizes_str,
                }
                
                await db.products.update_one({"product_id": pid}, {"$set": update_fields})
                migrated_count += 1
                continue
                
            print(f"Migrating {ep.get('product_name')} ({pid}) -> products catalog")
            
            # Generate new integer ID for the product
            new_id = await get_next_id(db, "products")
            
            # Map colors and sizes
            colors_docs = await db.excel_product_colors.find({"product_id": pid}).to_list(100)
            sizes_docs = await db.excel_product_sizes.find({"product_id": pid}).to_list(100)
            images_docs = await db.excel_product_images.find({"product_id": pid}).sort("sort_order", 1).to_list(100)
            
            colors_str = ",".join(c["color_name"] for c in colors_docs)
            sizes_str = ",".join(s["size_value"] for s in sizes_docs)
            
            # Create product slug
            import re
            slug = re.sub(r'[^a-zA-Z0-9]+', '-', ep.get("product_name", pid)).strip('-').lower()
            
            # Main product doc
            main_product = {
                "id": new_id,
                "product_id": pid,
                "name": ep.get("product_name", ""),
                "slug": slug,
                "original_price": float(ep.get("original_price", 0) or 0),
                "discounted_price": ep.get("discounted_price"),
                "description": ep.get("description", ""),
                "is_active": ep.get("is_active", True),
                "stock": 10,  # Default stock for excel imported products
                "category_id": None,
                "is_featured": False,
                "colors": colors_str,
                "sizes": sizes_str
            }
            
            await db.products.insert_one(main_product)
            
            # Map images to product_images
            for idx, img in enumerate(images_docs):
                img_id = await get_next_id(db, "product_images")
                await db.product_images.insert_one({
                    "id": img_id,
                    "product_id": new_id,
                    "color_variant_id": None,
                    "image_url": img.get("image_url", ""),
                    "is_primary": (idx == 0)
                })
                
            migrated_count += 1
            
        print(f"Successfully migrated {migrated_count} products to main products collection.")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(migrate_products())
