from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas, auth, database
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=schemas.TokenResponse)
def register(user_data: schemas.UserRegister, db: Session = Depends(database.get_db)):
    # Check if user exists
    if user_data.email and db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if user_data.phone and db.query(models.User).filter(models.User.phone == user_data.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    new_user = models.User(
        email=user_data.email,
        phone=user_data.phone,
        full_name=user_data.full_name,
        hashed_password=auth.get_password_hash(user_data.password),
        role="customer"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access = auth.create_access_token({"sub": str(new_user.id)})
    refresh = auth.create_refresh_token({"sub": str(new_user.id)})
    
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=schemas.TokenResponse)
def login(login_data: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(
        (models.User.email == login_data.identifier) | (models.User.phone == login_data.identifier)
    ).first()
    
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access = auth.create_access_token({"sub": str(user.id)})
    refresh = auth.create_refresh_token({"sub": str(user.id)})
    
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh(token_data: schemas.TokenRefresh, db: Session = Depends(database.get_db)):
    # Basic refresh logic without DB check for simplicity as requested
    try:
        from jose import jwt
        from config import settings
        payload = jwt.decode(token_data.refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None or payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    access = auth.create_access_token({"sub": str(user.id)})
    return {
        "access_token": access,
        "refresh_token": token_data.refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.put("/me/password")
def change_password(
    password_data: schemas.PasswordChange, 
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    if not auth.verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = auth.get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
