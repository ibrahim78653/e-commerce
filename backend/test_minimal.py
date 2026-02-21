from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "Test"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

try:
    s = Settings()
    print("Minimal Settings Success")
except Exception as e:
    print(f"Minimal Settings Failure: {e}")
