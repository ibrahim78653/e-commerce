import os
from dotenv import load_dotenv

print("Loading .env...")
success = load_dotenv()
print(f"load_dotenv result: {success}")

print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")
print(f"MONGODB_URL: {os.getenv('MONGODB_URL')}")
