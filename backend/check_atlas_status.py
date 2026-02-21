import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    uri = "mongodb+srv://ibrahimkhargonwala:786ibrahim53@burhanicollection.xjiijt3.mongodb.net/BurhaniCollection?retryWrites=true&w=majority"
    client = AsyncIOMotorClient(uri)
    db = client["BurhaniCollection"]
    products = await db.products.find().to_list(length=10)
    print(f"Total products found: {len(products)}")
    for p in products:
        print(f"ID: {p.get('id')}, Name: {p.get('name')}, is_active: {p.get('is_active')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
