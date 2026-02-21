import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

async def f():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    res = await db.products.update_many({}, {"$set": {"is_active": True}})
    print(f"Updated {res.modified_count} products.")
    client.close()

if __name__ == "__main__":
    asyncio.run(f())
