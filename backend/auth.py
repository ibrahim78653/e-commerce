from datetime import datetime, timedelta
from typing import Optional, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import database
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Any = Depends(database.get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            print(f"DEBUG AUTH: sub missing in token")
            raise HTTPException(status_code=401, detail="Invalid token: sub missing")
        if payload.get("type") != "access":
            print(f"DEBUG AUTH: invalid token type: {payload.get('type')}")
            raise HTTPException(status_code=401, detail="Invalid token: incorrect type")
    except JWTError as e:
        print(f"DEBUG AUTH: JWT decode error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
    # In MongoDB, we lookup in the 'users' collection
    user = await db.users.find_one({"id": int(user_id)})
    if not user:
        print(f"DEBUG AUTH: user not found for ID {user_id}")
        raise HTTPException(status_code=401, detail="User not found")
    
    # To maintain compatibility with code that uses user.role, etc.
    # we can convert the dict to an object-like structure or just use it as is if we refactor rest
    # For now, let's use a simple Munch or Box like approach or just a class
    class UserObject:
        def __init__(self, **entries):
            self.__dict__.update(entries)
    
    return UserObject(**user)

async def get_admin(current_user: Any = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
