from fastapi import APIRouter, Depends, HTTPException
from typing import List, Any
from datetime import datetime
import schemas, auth, database

router = APIRouter(prefix="/api/products/{product_id}/reviews", tags=["Reviews"])

@router.get("/", response_model=List[schemas.ReviewResponse])
async def get_reviews(product_id: int, db: Any = Depends(database.get_db)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    reviews_cursor = db.reviews.find({"product_id": product_id}).sort("created_at", -1)
    reviews = await reviews_cursor.to_list(length=100)
    
    # Strip _id
    return [{k: v for k, v in r.items() if k != "_id"} for r in reviews]

@router.post("/", response_model=schemas.ReviewResponse)
async def create_review(
    product_id: int, 
    review: schemas.ReviewCreate, 
    current_user: Any = Depends(auth.get_current_user), 
    db: Any = Depends(database.get_db)
):
    if not (1 <= review.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Check if user already reviewed
    existing = await db.reviews.find_one({"product_id": product_id, "user_id": current_user.id})
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
        
    # Initialize counter if not exists
    count_doc = await db.counters.find_one({"_id": "reviews"})
    if not count_doc:
        max_doc = await db.reviews.find_one(sort=[("id", -1)])
        start_val = max_doc.get("id", 0) if max_doc else 0
        await db.counters.update_one({"_id": "reviews"}, {"$set": {"seq": start_val}}, upsert=True)

    new_id = await database.get_next_id(db, "reviews")
    
    new_review = {
        "id": new_id,
        "product_id": product_id,
        "user_id": current_user.id,
        "user_name": current_user.full_name or "Anonymous User",
        "rating": review.rating,
        "comment": review.comment,
        "created_at": datetime.utcnow()
    }
    
    await db.reviews.insert_one(new_review)
    
    return {k: v for k, v in new_review.items() if k != "_id"}
