"""
Configuration Management using Pydantic Settings
Loads environment variables and provides typed configuration
"""
from pydantic_settings import BaseSettings
from typing import List, Optional
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
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Returns cached settings instance
    Use this function to access settings throughout the application
    """
    return Settings()


# Convenience instance for imports
settings = get_settings()
