from fastapi import APIRouter, Depends, HTTPException
from typing import List, Any
import schemas, auth, database

router = APIRouter(prefix="/api/admin/users", tags=["Admin Users"])

@router.get("/", response_model=List[schemas.UserResponse])
async def get_all_users(
    skip: int = 0, 
    limit: int = 100, 
    admin: Any = Depends(auth.get_admin), 
    db: Any = Depends(database.get_db)
):
    users = await db.users.find().skip(skip).limit(limit).to_list(length=limit)
    return users

@router.put("/{user_id}/block")
async def toggle_user_block(
    user_id: int, 
    block_status: bool, # True to block, False to unblock
    admin: Any = Depends(auth.get_admin), 
    db: Any = Depends(database.get_db)
):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Cannot block an admin")
    
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": not block_status}})
    return {"message": f"User {'blocked' if block_status else 'unblocked'} successfully"}
