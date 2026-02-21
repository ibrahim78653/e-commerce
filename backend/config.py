from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Optional, Any, Union
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "Burhani Collection E-Commerce"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "sqlite:///./ecommerce.db"
    MONGODB_URL: Optional[str] = None
    DB_NAME: str = "BurhaniCollection"
    
    # JWT
    JWT_SECRET_KEY: str = "burhani-super-secret-key-change-this-in-production-2024"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:8000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = None
    
    # WhatsApp
    WHATSAPP_BUSINESS_NUMBER: str = "919039465020"
    
    # File Upload
    UPLOAD_DIR: str = "static/uploads"
    MAX_UPLOAD_SIZE: int = 5242880
    ALLOWED_IMAGE_EXTENSIONS: Union[List[str], str] = [".jpg", ".jpeg", ".png", ".webp"]

    @field_validator("ALLOWED_IMAGE_EXTENSIONS", mode="before")
    @classmethod
    def assemble_image_extensions(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
