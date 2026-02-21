import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def convert_to_booleans():
    uri = "mongodb+srv://ibrahimkhargonwala:786ibrahim53@burhanicollection.xjiijt3.mongodb.net/BurhaniCollection?retryWrites=true&w=majority"
    client = AsyncIOMotorClient(uri)
    db = client["BurhaniCollection"]
    
    # Products
    await db.products.update_many({"is_active": 1}, {"$set": {"is_active": True}})
    await db.products.update_many({"is_active": 0}, {"$set": {"is_active": False}})
    await db.products.update_many({"is_featured": 1}, {"$set": {"is_featured": True}})
    await db.products.update_many({"is_featured": 0}, {"$set": {"is_featured": False}})
    
    # Categories
    # (Checking if categories have is_active, usually yes)
    await db.categories.update_many({"is_active": 1}, {"$set": {"is_active": True}})
    await db.categories.update_many({"is_active": 0}, {"$set": {"is_active": False}})
    
    # Color Variants
    await db.product_color_variants.update_many({"is_active": 1}, {"$set": {"is_active": True}})
    await db.product_color_variants.update_many({"is_active": 0}, {"$set": {"is_active": False}})
    await db.product_color_variants.update_many({"show_in_carousel": 1}, {"$set": {"show_in_carousel": True}})
    await db.product_color_variants.update_many({"show_in_carousel": 0}, {"$set": {"show_in_carousel": False}})
    
    # Images
    await db.product_images.update_many({"is_primary": 1}, {"$set": {"is_primary": True}})
    await db.product_images.update_many({"is_primary": 0}, {"$set": {"is_primary": False}})
    
    # Users
    await db.users.update_many({"is_active": 1}, {"$set": {"is_active": True}})
    await db.users.update_many({"is_active": 0}, {"$set": {"is_active": False}})

    print("Boolean conversion complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(convert_to_booleans())
