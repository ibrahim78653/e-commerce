from fastapi import APIRouter, Depends, HTTPException
from typing import List, Any
import auth, database

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])

@router.get("/")
async def get_wishlist(current_user: Any = Depends(auth.get_current_user), db: Any = Depends(database.get_db)):
    wishlist = await db.wishlists.find_one({"user_id": current_user.id})
    if not wishlist:
        return {"items": []}
    
    # Fetch product details for the wishlist
    product_ids = wishlist.get("product_ids", [])
    if not product_ids:
        return {"items": []}
        
    products_cursor = db.products.find({"id": {"$in": product_ids}, "is_active": True})
    products = await products_cursor.to_list(length=100)
    
    # Strip _id
    clean_products = []
    for p in products:
        p_dict = {k: v for k, v in p.items() if k != "_id"}
        clean_products.append(p_dict)
        
    return {"items": clean_products}

@router.post("/{product_id}")
async def add_to_wishlist(product_id: int, current_user: Any = Depends(auth.get_current_user), db: Any = Depends(database.get_db)):
    product = await db.products.find_one({"id": product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    wishlist = await db.wishlists.find_one({"user_id": current_user.id})
    if not wishlist:
        await db.wishlists.insert_one({"user_id": current_user.id, "product_ids": [product_id]})
    else:
        if product_id not in wishlist.get("product_ids", []):
            await db.wishlists.update_one({"user_id": current_user.id}, {"$push": {"product_ids": product_id}})
            
    return {"message": "Product added to wishlist"}

@router.delete("/{product_id}")
async def remove_from_wishlist(product_id: int, current_user: Any = Depends(auth.get_current_user), db: Any = Depends(database.get_db)):
    await db.wishlists.update_one(
        {"user_id": current_user.id}, 
        {"$pull": {"product_ids": product_id}}
    )
    return {"message": "Product removed from wishlist"}
