import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    doc = await db.products.find_one()
    print(doc)

if __name__ == "__main__":
    asyncio.run(main())
