from config import settings
import json

print(f"APP_NAME: {settings.APP_NAME}")
print(f"CORS_ORIGINS: {json.dumps(settings.CORS_ORIGINS, indent=2)}")
print(f"DATABASE_URL: {settings.DATABASE_URL}")
