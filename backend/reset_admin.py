import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from auth import get_password_hash

async def reset_admin():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    hashed_password = get_password_hash("admin123")
    result = await db.users.update_one(
        {"email": "admin@burhani.com"},
        {"$set": {"hashed_password": hashed_password}}
    )
    
    if result.modified_count > 0:
        print("Admin password reset to 'admin123'")
    else:
        print("Could not find admin user to reset password.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(reset_admin())
