"""
Database configuration for MongoDB Atlas
"""
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging

logger = logging.getLogger(__name__)

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

import asyncio

async def init_db():
    """
    Initialize database - creates indexes for performance optimization
    """
    try:
        # Products indexes
        await db.products.create_index("product_id", unique=True)
        await db.products.create_index("category")
        await db.products.create_index("is_active")
        await db.products.create_index("discounted_price")
        
        # Orders indexes
        await db.orders.create_index("user_id")
        await db.orders.create_index("status")
        await db.orders.create_index("created_at")
        
        # Users indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("phone", unique=True, sparse=True)
        
        logger.info("Database indexes ensured.")
    except Exception as e:
        logger.error(f"Failed to create indexes: {e}")
