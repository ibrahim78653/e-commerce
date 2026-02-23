import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

async def fix_admin_role():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    
    email = "admin@burhani.com"
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"role": "admin"}}
    )
    
    if result.modified_count > 0:
        print(f"Successfully updated role for {email} to 'admin'")
    else:
        print(f"No changes made for {email} (maybe already admin or user not found)")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_admin_role())
