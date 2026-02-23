import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

async def check():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    users = await db.users.count_documents({})
    prods = await db.products.count_documents({})
    cats = await db.categories.count_documents({})
    
    admin = await db.users.find_one({"role": "admin"})
    
    print(f"Users: {users}")
    print(f"Products: {prods}")
    print(f"Categories: {cats}")
    if admin:
        print(f"Admin found: {admin['email']}")
    else:
        print("Admin NOT found!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
