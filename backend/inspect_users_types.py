import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

async def inspect_users():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    users = await db.users.find().to_list(100)
    for u in users:
        print(f"User: {u.get('email')}")
        print(f"  _id: {u.get('_id')} (type: {type(u.get('_id'))})")
        print(f"  id: {u.get('id')} (type: {type(u.get('id'))})")
        print(f"  role: {u.get('role')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(inspect_users())
