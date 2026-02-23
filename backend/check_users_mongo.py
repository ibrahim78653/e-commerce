import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

async def check_users():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    users = await db.users.find().to_list(100)
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"ID: {u.get('id')}, Email: {u.get('email')}, Role: {u.get('role')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_users())
