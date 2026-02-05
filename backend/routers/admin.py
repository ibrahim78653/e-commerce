from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth, database

router = APIRouter(prefix="/api/admin/users", tags=["Admin Users"])

@router.get("/", response_model=List[schemas.UserResponse])
def get_all_users(
    skip: int = 0, 
    limit: int = 100, 
    admin: models.User = Depends(auth.get_admin), 
    db: Session = Depends(database.get_db)
):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.put("/{user_id}/block")
def toggle_user_block(
    user_id: int, 
    block_status: bool, # True to block, False to unblock
    admin: models.User = Depends(auth.get_admin), 
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot block an admin")
        
    # In models.py we have is_active. Blocking means is_active = False?
    # Or should we use a separate field? The model has is_active.
    # Usually is_active=False means blocked/disabled.
    
    user.is_active = not block_status
    db.commit()
    return {"message": f"User {'blocked' if block_status else 'unblocked'} successfully"}
