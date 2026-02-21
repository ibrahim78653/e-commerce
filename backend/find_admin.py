import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

async def find_admin():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    admin = await db.users.find_one({"role": "admin"})
    if admin:
        print(f"Admin found: {admin.get('email')} (ID: {admin.get('id')})")
    else:
        print("No admin found in MongoDB.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(find_admin())
