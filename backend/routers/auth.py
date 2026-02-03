"""
Authentication API endpoints
Handles user registration, login, token refresh, and logout
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

import models, schemas, auth, database
from config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: schemas.UserRegister,
    db: Session = Depends(database.get_db)
):
    """
    Register a new user with email OR phone number
    Returns access and refresh tokens
    """
    # Validate that either email or phone is provided
    if not user_data.email and not user_data.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone number is required"
        )
    
    # Validate password strength
    is_valid, error_msg = auth.validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Check if user already exists
    if user_data.email:
        existing_user = db.query(models.User).filter(
            models.User.email == user_data.email
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    if user_data.phone:
        normalized_phone = auth.normalize_phone(user_data.phone)
        existing_user = db.query(models.User).filter(
            models.User.phone == normalized_phone
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
    
    # Create new user
    hashed_password = auth.get_password_hash(user_data.password)
    
    new_user = models.User(
        email=user_data.email,
        phone=auth.normalize_phone(user_data.phone) if user_data.phone else None,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=models.UserRole.CUSTOMER
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate tokens
    access_token = auth.create_access_token(data={"sub": new_user.id})
    refresh_token = auth.create_refresh_token(data={"sub": new_user.id})
    
    # Store refresh token
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    auth.store_refresh_token(db, new_user.id, refresh_token, expires_at)
    
    return schemas.TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=schemas.UserResponse.from_orm(new_user)
    )


@router.post("/login", response_model=schemas.TokenResponse)
async def login(
    login_data: schemas.UserLogin,
    db: Session = Depends(database.get_db)
):
    """
    Login with email/phone and password
    Returns access and refresh tokens
    """
    # Authenticate user
    user = auth.authenticate_user(db, login_data.identifier, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Generate tokens
    access_token = auth.create_access_token(data={"sub": user.id})
    refresh_token = auth.create_refresh_token(data={"sub": user.id})
    
    # Store refresh token
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    auth.store_refresh_token(db, user.id, refresh_token, expires_at)
    
    return schemas.TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=schemas.UserResponse.from_orm(user)
    )


@router.post("/refresh", response_model=schemas.TokenResponse)
async def refresh_token(
    token_data: schemas.TokenRefresh,
    db: Session = Depends(database.get_db)
):
    """
    Refresh access token using refresh token
    """
    user = auth.verify_refresh_token(db, token_data.refresh_token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Generate new access token
    access_token = auth.create_access_token(data={"sub": user.id})
    
    # Return same refresh token (or generate new one if you want rotation)
    return schemas.TokenResponse(
        access_token=access_token,
        refresh_token=token_data.refresh_token,
        token_type="bearer",
        user=schemas.UserResponse.from_orm(user)
    )


@router.post("/logout", response_model=schemas.MessageResponse)
async def logout(
    token_data: schemas.TokenRefresh,
    db: Session = Depends(database.get_db)
):
    """
    Logout user by revoking refresh token
    """
    success = auth.revoke_refresh_token(db, token_data.refresh_token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found"
        )
    
    return schemas.MessageResponse(message="Successfully logged out")


@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_profile(
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get current authenticated user's profile
    """
    return schemas.UserResponse.from_orm(current_user)


@router.put("/me/password", response_model=schemas.MessageResponse)
async def change_password(
    password_data: schemas.PasswordChange,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Change user password
    """
    # Verify old password
    if not auth.verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Validate new password
    is_valid, error_msg = auth.validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Update password
    current_user.hashed_password = auth.get_password_hash(password_data.new_password)
    db.commit()
    
    return schemas.MessageResponse(message="Password updated successfully")
