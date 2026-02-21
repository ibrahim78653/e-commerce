"""
Database configuration for MongoDB Atlas
"""
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

# Create MongoDB client
client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DB_NAME]

async def get_db():
    """
    Database dependency for FastAPI
    Yields the MongoDB database instance
    """
    try:
        yield db
    finally:
        # In motor, we don't usually need to close the connection per request
        pass

async def get_next_id(db, collection_name: str):
    """
    Auto-incrementing ID generator for MongoDB
    """
    res = await db.counters.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return res["seq"]

def init_db():
    """
    Initialize database - can be used to create indexes
    """
    # For MongoDB, we might want to ensure some indexes
    # async indices since motor is async
    pass
