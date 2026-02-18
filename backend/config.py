"""
Configuration Management using Pydantic Settings
Loads environment variables and provides typed configuration
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Optional, Any
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "Burhani Collection E-Commerce"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ecommerce"
    # For SQLite development: DATABASE_URL: str = "sqlite:///./ecommerce.db"
    
    # JWT Authentication
    JWT_SECRET_KEY: str = "temporary-secret-key-change-this-immediately"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Security
    PASSWORD_MIN_LENGTH: int = 8
    BCRYPT_ROUNDS: int = 12
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://localhost:8000"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            # If it's a string like '["a", "b"]', strip brackets first
            v = v.strip().lstrip("[").rstrip("]")
            # Split by comma and clean each item
            return [i.strip().strip('"').strip("'") for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i).strip().strip('"').strip("'") for i in v]
        return v
    
    # Razorpay (Payment Gateway)
    RAZORPAY_KEY_ID: str = ""  # Public key
    RAZORPAY_KEY_SECRET: str = ""  # Private key - keep secret!
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = None
    
    # WhatsApp Integration
    WHATSAPP_BUSINESS_NUMBER: str = "917869622753"
    
    # File Upload
    UPLOAD_DIR: str = "static/uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Rate Limiting
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_REGISTER: str = "3/minute"
    RATE_LIMIT_ORDER: str = "10/minute"
    RATE_LIMIT_DEFAULT: str = "60/minute"
    
    # Email (for future implementation)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FROM_EMAIL: Optional[str] = None
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"
    }


@lru_cache()
def get_settings() -> Settings:
    """
    Returns cached settings instance
    Use this function to access settings throughout the application
    """
    return Settings()


# Convenience instance for imports
settings = get_settings()
