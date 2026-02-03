"""
Authentication utilities and JWT token management
Handles password hashing, token generation, and user verification
"""
from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import re

import models, database, schemas
from config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token security
security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


# ==================== PASSWORD UTILITIES ====================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength
    Returns (is_valid, error_message)
    """
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        return False, f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    
    # Optional: Check for special characters
    # if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
    #     return False, "Password must contain at least one special character"
    
    return True, None


# ==================== TOKEN UTILITIES ====================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT refresh token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decode and verify JWT token
    Raises JWTError if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


# ==================== USER AUTHENTICATION ====================
def authenticate_user(db: Session, identifier: str, password: str) -> Optional[models.User]:
    """
    Authenticate user by email or phone number
    Returns User object if credentials are valid, None otherwise
    """
    # Try to find user by email or phone
    user = None
    
    # Check if identifier is email format
    if "@" in identifier:
        user = db.query(models.User).filter(models.User.email == identifier).first()
    else:
        # Assume phone number - clean it first
        cleaned_phone = identifier.replace(" ", "").replace("-", "")
        user = db.query(models.User).filter(models.User.phone == cleaned_phone).first()
    
    if not user:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(database.get_db)
) -> models.User:
    """
    Dependency to get current authenticated user from JWT token
    Use this in route dependencies to protect endpoints
    
    Example:
        @app.get("/profile")
        def get_profile(current_user: User = Depends(get_current_user)):
            return current_user
    """
    token = credentials.credentials
    
    try:
        payload = decode_token(token)
        
        # Check token type
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
    db: Session = Depends(database.get_db)
) -> Optional[models.User]:
    """
    Optional dependency to get current user if token is provided
    Returns None if no token or invalid token
    """
    if not credentials:
        return None
        
    token = credentials.credentials
    
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
            
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
            
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user and user.is_active:
            return user
    except Exception:
        pass
        
    return None


def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """
    Get current user and verify they are active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    return current_user


def get_current_admin_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """
    Get current user and verify they are an admin
    Use this to protect admin-only endpoints
    """
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ==================== REFRESH TOKEN MANAGEMENT ====================
def store_refresh_token(db: Session, user_id: int, token: str, expires_at: datetime) -> None:
    """
    Store refresh token in database
    """
    refresh_token = models.RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    db.add(refresh_token)
    db.commit()


def verify_refresh_token(db: Session, token: str) -> Optional[models.User]:
    """
    Verify refresh token and return associated user
    Returns None if token is invalid or revoked
    """
    try:
        payload = decode_token(token)
        
        # Check token type
        if payload.get("type") != "refresh":
            return None
        
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
        
        # Check if token exists in database and is not revoked
        db_token = db.query(models.RefreshToken).filter(
            models.RefreshToken.token == token,
            models.RefreshToken.is_revoked == False
        ).first()
        
        if not db_token:
            return None
        
        # Get user
        user = db.query(models.User).filter(models.User.id == user_id).first()
        return user
        
    except JWTError:
        return None


def revoke_refresh_token(db: Session, token: str) -> bool:
    """
    Revoke a refresh token (used for logout)
    Returns True if token was revoked, False if not found
    """
    db_token = db.query(models.RefreshToken).filter(
        models.RefreshToken.token == token
    ).first()
    
    if db_token:
        db_token.is_revoked = True
        db_token.revoked_at = datetime.utcnow()
        db.commit()
        return True
    
    return False


# ==================== EMAIL/PHONE VALIDATION ====================
def is_valid_email(email: str) -> bool:
    """Validate email format"""
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_regex, email) is not None


def is_valid_phone(phone: str) -> bool:
    """Validate phone number format"""
    # Remove common separators
    cleaned = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    
    # Check if it's all digits and has reasonable length (10-15 digits)
    return cleaned.isdigit() and 10 <= len(cleaned) <= 15


def normalize_phone(phone: str) -> str:
    """
    Normalize phone number by removing spaces and dashes
    """
    return phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
