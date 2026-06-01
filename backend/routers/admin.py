from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Any
import schemas, auth, database

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/users", response_model=List[schemas.UserResponse])
async def get_all_users(
    skip: int = 0, 
    limit: int = 100, 
    admin: Any = Depends(auth.get_admin), 
    db: Any = Depends(database.get_db)
):
    users = await db.users.find().skip(skip).limit(limit).to_list(length=limit)
    # Strip MongoDB _id, ensure is_active defaults to True if missing
    result = []
    for u in users:
        user_dict = {k: v for k, v in u.items() if k != "_id"}
        if "is_active" not in user_dict:
            user_dict["is_active"] = True
        result.append(user_dict)
    return result

@router.put("/users/{user_id}/block")
async def toggle_user_block(
    user_id: int, 
    block_status: bool = Query(..., description="True to block, False to unblock"),
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

@router.get("/stats")
async def get_admin_stats(admin: Any = Depends(auth.get_admin), db: Any = Depends(database.get_db)):
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({})
    
    # Calculate total revenue
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}]
    revenue_cursor = db.orders.aggregate(pipeline)
    revenue_list = await revenue_cursor.to_list(length=1)
    total_revenue = revenue_list[0]["total"] if revenue_list else 0
    
    pending_orders = await db.orders.count_documents({"status": "pending"})
    
    # Get recent orders
    recent_orders_cursor = db.orders.find().sort("created_at", -1).limit(5)
    recent_orders = await recent_orders_cursor.to_list(length=5)
    
    # Remove _id from recent_orders
    clean_recent_orders = []
    for order in recent_orders:
        order_dict = {k: v for k, v in order.items() if k != "_id"}
        clean_recent_orders.append(order_dict)
    
    # Revenue by day (last 30 days)
    from datetime import datetime, timedelta, timezone
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    daily_revenue_pipeline = [
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                },
                "revenue": {"$sum": "$total_amount"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    daily_revenue_cursor = db.orders.aggregate(daily_revenue_pipeline)
    daily_revenue_list = await daily_revenue_cursor.to_list(length=30)
    
    revenue_by_day = [{"date": item["_id"], "revenue": item["revenue"]} for item in daily_revenue_list]
    
    # Orders by status
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_cursor = db.orders.aggregate(status_pipeline)
    status_list = await status_cursor.to_list(length=10)
    orders_by_status = {item["_id"]: item["count"] for item in status_list}
    
    # Top products by order count
    top_products_pipeline = [
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.product_name", "count": {"$sum": "$items.quantity"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_products_cursor = db.order_items.aggregate([
        {"$group": {"_id": "$product_name", "count": {"$sum": "$quantity"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ])
    
    # In MongoDB, the items are in order_items collection, not embedded in orders directly,
    # except when created. order_items collection has product_name.
    top_products_cursor = db.order_items.aggregate([
        {"$group": {"_id": "$product_name", "count": {"$sum": "$quantity"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ])
    top_products_list = await top_products_cursor.to_list(length=5)
    top_products = [{"name": item["_id"], "count": item["count"]} for item in top_products_list]
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_users": total_users,
        "total_revenue": total_revenue,
        "pending_orders": pending_orders,
        "recent_orders": clean_recent_orders,
        "revenue_by_day": revenue_by_day,
        "orders_by_status": orders_by_status,
        "top_products": top_products
    }
