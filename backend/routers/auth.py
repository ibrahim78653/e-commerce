from fastapi import APIRouter, Depends, HTTPException, status
import schemas, auth, database
from typing import Any
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=schemas.TokenResponse)
async def register(user_data: schemas.UserRegister, db: Any = Depends(database.get_db)):
    # Check if user exists
    if user_data.email and await db.users.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if user_data.phone and await db.users.find_one({"phone": user_data.phone}):
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Initialize counter if not exists
    count_doc = await db.counters.find_one({"_id": "users"})
    if not count_doc:
        max_user = await db.users.find_one(sort=[("id", -1)])
        start_val = max_user["id"] if max_user else 0
        await db.counters.update_one({"_id": "users"}, {"$set": {"seq": start_val}}, upsert=True)

    new_id = await database.get_next_id(db, "users")
    
    new_user_dict = {
        "id": new_id,
        "email": user_data.email,
        "phone": user_data.phone,
        "full_name": user_data.full_name,
        "hashed_password": auth.get_password_hash(user_data.password),
        "role": "customer",
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(new_user_dict)
    
    access = auth.create_access_token({"sub": str(new_id)})
    refresh = auth.create_refresh_token({"sub": str(new_id)})
    
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": new_user_dict
    }

@router.post("/login", response_model=schemas.TokenResponse)
async def login(login_data: schemas.UserLogin, db: Any = Depends(database.get_db)):
    user = await db.users.find_one({
        "$or": [
            {"email": login_data.identifier},
            {"phone": login_data.identifier}
        ]
    })
    
    if not user or not auth.verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access = auth.create_access_token({"sub": str(user["id"])})
    refresh = auth.create_refresh_token({"sub": str(user["id"])})
    
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=schemas.UserResponse)
async def get_me(current_user: Any = Depends(auth.get_current_user)):
    # get_current_user now returns a UserObject
    return current_user.__dict__

@router.post("/refresh", response_model=schemas.TokenResponse)
async def refresh(token_data: schemas.TokenRefresh, db: Any = Depends(database.get_db)):
    try:
        from jose import jwt
        from config import settings
        payload = jwt.decode(token_data.refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None or payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user = await db.users.find_one({"id": int(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    access = auth.create_access_token({"sub": str(user["id"])})
    return {
        "access_token": access,
        "refresh_token": token_data.refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.put("/me/password")
async def change_password(
    password_data: schemas.PasswordChange, 
    current_user: Any = Depends(auth.get_current_user), 
    db: Any = Depends(database.get_db)
):
    if not auth.verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    new_hashed = auth.get_password_hash(password_data.new_password)
    await db.users.update_one({"id": current_user.id}, {"$set": {"hashed_password": new_hashed}})
    return {"message": "Password updated successfully"}

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}
