import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

async def fix_admin_role():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    # Try finding by ID if email is fuzzy
    user = await db.users.find_one({"id": 5})
    if user:
        print(f"Found user by ID 5: {user.get('email')}, current role: {user.get('role')}")
        result = await db.users.update_one(
            {"id": 5},
            {"$set": {"role": "admin"}}
        )
        print(f"Modified count: {result.modified_count}")
    else:
        print("User with ID 5 not found.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_admin_role())
