import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

async def inspect():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    users = await db.users.find().to_list(100)
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"---")
        print(f"Email: {u.get('email')}")
        print(f"ID: {u.get('id')} (Type: {type(u.get('id'))})")
        print(f"Role: {u.get('role')}")
        print(f"Hashed PW starts with: {str(u.get('hashed_password'))[:10]}...")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(inspect())
