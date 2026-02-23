"""
Seed script for MongoDB
Creates admin user, categories, and sample products
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from auth import get_password_hash
from database import get_next_id
from datetime import datetime


async def seed_database():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]

    try:
        # ─── 1. Create admin user ───
        existing_admin = await db.users.find_one({"email": "admin@burhani.com"})
        if not existing_admin:
            # Initialize counter
            count_doc = await db.counters.find_one({"_id": "users"})
            if not count_doc:
                max_user = await db.users.find_one(sort=[("id", -1)])
                start_val = max_user["id"] if max_user else 0
                await db.counters.update_one({"_id": "users"}, {"$set": {"seq": start_val}}, upsert=True)

            new_id = await get_next_id(db, "users")
            admin = {
                "id": new_id,
                "email": "admin@burhani.com",
                "phone": "9876543210",
                "full_name": "Admin User",
                "hashed_password": get_password_hash("Admin@123"),
                "role": "admin",
                "created_at": datetime.utcnow(),
            }
            await db.users.insert_one(admin)
            print(f"✅ Admin user created (ID: {new_id}, Email: admin@burhani.com, Password: Admin@123)")
        else:
            # Ensure the admin has the admin role
            if existing_admin.get("role") != "admin":
                await db.users.update_one({"email": "admin@burhani.com"}, {"$set": {"role": "admin"}})
                print("✅ Admin role fixed for admin@burhani.com")
            else:
                print("ℹ️  Admin user already exists with correct role.")

        # ─── 2. Create categories ───
        cat_count = await db.categories.count_documents({})
        if cat_count == 0:
            # Initialize counter
            await db.counters.update_one({"_id": "categories"}, {"$set": {"seq": 0}}, upsert=True)

            cat_data = [
                {"name": "Ladies Wear", "slug": "ladies-wear"},
                {"name": "Gents Wear", "slug": "gents-wear"},
                {"name": "Kids Wear", "slug": "kids-wear"},
                {"name": "Accessories", "slug": "accessories"},
            ]
            for c in cat_data:
                c_id = await get_next_id(db, "categories")
                c["id"] = c_id
                await db.categories.insert_one(c)
            print("✅ Categories seeded.")
        else:
            print(f"ℹ️  Categories already exist ({cat_count} found).")

        # ─── 3. Create sample products ───
        prod_count = await db.products.count_documents({})
        if prod_count == 0:
            # Initialize counter
            await db.counters.update_one({"_id": "products"}, {"$set": {"seq": 0}}, upsert=True)
            await db.counters.update_one({"_id": "product_images"}, {"$set": {"seq": 0}}, upsert=True)

            products_data = [
                {
                    "name": "Elegant Saree",
                    "slug": "elegant-saree",
                    "description": "Silk saree perfect for weddings.",
                    "short_description": "Premium Silk Saree",
                    "original_price": 2999.00,
                    "discounted_price": 2499.00,
                    "stock": 50,
                    "category_id": 1,
                    "is_featured": True,
                    "is_active": True,
                    "sizes": "Free Size",
                    "colors": "Red, Gold",
                    "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500",
                },
                {
                    "name": "Designer Kurta",
                    "slug": "designer-kurta",
                    "description": "Cotton kurta for summer.",
                    "short_description": "Comfortable Cotton Kurta",
                    "original_price": 1499.00,
                    "discounted_price": 1199.00,
                    "stock": 100,
                    "category_id": 2,
                    "is_featured": True,
                    "is_active": True,
                    "sizes": "S, M, L, XL",
                    "colors": "White, Blue",
                    "image_url": "https://images.unsplash.com/photo-1598582236531-9252c8034d6c?w=500",
                },
                {
                    "name": "Kids Party Dress",
                    "slug": "kids-party-dress",
                    "description": "Cute dress for little ones.",
                    "short_description": "Party Wear",
                    "original_price": 999.00,
                    "discounted_price": 799.00,
                    "stock": 30,
                    "category_id": 3,
                    "is_featured": False,
                    "is_active": True,
                    "sizes": "2-3Y, 4-5Y",
                    "colors": "Pink",
                    "image_url": "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500",
                },
            ]

            for p in products_data:
                img_url = p.pop("image_url")
                p_id = await get_next_id(db, "products")
                p["id"] = p_id
                await db.products.insert_one(p)

                # Create image
                img_id = await get_next_id(db, "product_images")
                img = {
                    "id": img_id,
                    "product_id": p_id,
                    "image_url": img_url,
                    "is_primary": True,
                    "color_variant_id": None,
                }
                await db.product_images.insert_one(img)

            print("✅ Sample products seeded.")
        else:
            print(f"ℹ️  Products already exist ({prod_count} found).")

        print("\n🎉 Database seeding complete!")
        print("   Admin login: admin@burhani.com / Admin@123")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
