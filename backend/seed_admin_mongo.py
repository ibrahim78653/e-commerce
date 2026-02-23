import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from auth import get_password_hash
from datetime import datetime

async def seed_admin():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    admin_email = "admin@burhani.com"
    existing_admin = await db.users.find_one({"email": admin_email})
    
    if not existing_admin:
        # Initialize counter if not exists
        count_doc = await db.counters.find_one({"_id": "users"})
        if not count_doc:
            max_user = await db.users.find_one(sort=[("id", -1)])
            start_val = max_user["id"] if max_user else 0
            await db.counters.update_one({"_id": "users"}, {"$set": {"seq": start_val}}, upsert=True)

        from database import get_next_id
        new_id = await get_next_id(db, "users")
        
        admin_user = {
            "id": new_id,
            "email": admin_email,
            "phone": "9876543210",
            "full_name": "Admin User",
            "hashed_password": get_password_hash("Admin@123"),
            "role": "admin",
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
        print(f"Admin user seeded with ID {new_id}")
    else:
        print("Admin user already exists.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_admin())
