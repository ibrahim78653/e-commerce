import os
import sys
import json
from sqlalchemy import create_engine, text
from pydantic_settings import BaseSettings
from typing import List

# Mock settings class to test loading
class TestSettings(BaseSettings):
    CORS_ORIGINS: List[str]
    DATABASE_URL: str
    
    class Config:
        env_file = ".env"

print("--- Checking Configuration Loading ---")
try:
    from config import settings
    print("SUCCESS: Configuration loaded successfully.")
    print(f"CORS_ORIGINS: {settings.CORS_ORIGINS}")
    print(f"DATABASE_URL: {settings.DATABASE_URL}")
    db_url = settings.DATABASE_URL
except Exception as e:
    print(f"ERROR: Failed to load configuration: {e}")
    # Fallback to manual loading for DB check
    import dotenv
    dotenv.load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    print(f"Loaded DATABASE_URL from .env manually: {db_url}")

print("\n--- Checking Database Connectivity ---")
if not db_url:
    print("ERROR: No DATABASE_URL found.")
    sys.exit(1)

try:
    # Handle SQLite relative path fix if running from backend dir
    if db_url.startswith("sqlite:///./") and os.path.exists("ecommerce.db"):
        print(f"Using SQLite database at {os.path.abspath('ecommerce.db')}")
    
    engine = create_engine(db_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print(f"SUCCESS: Database connection successful. Result: {result.scalar()}")
except Exception as e:
    print(f"ERROR: Database connection failed: {e}")
