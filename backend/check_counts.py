import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

async def check():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    total = await db.products.count_documents({})
    active = await db.products.count_documents({"is_active": True})
    inactive = await db.products.count_documents({"is_active": False})
    
    print(f"Total: {total}, Active: {active}, Inactive: {inactive}")
    
    p1 = await db.products.find_one({"id": 1})
    print(f"Product 1: {p1}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
