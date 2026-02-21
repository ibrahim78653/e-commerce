from fastapi import APIRouter, Depends, HTTPException
import schemas, auth, database
from typing import List, Optional, Any
import razorpay
from urllib.parse import quote
from config import settings
from datetime import datetime

router = APIRouter(prefix="/api", tags=["Orders"])

razorpay_client = None
if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

@router.post("/orders", response_model=schemas.OrderResponse)
async def create_order(order_data: schemas.OrderCreate, db: Any = Depends(database.get_db), current_user: Optional[Any] = Depends(auth.get_current_user)):
    total = 0
    items_to_create = []
    
    for item in order_data.items:
        product = await db.products.find_one({"id": item.product_id})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        # Handle color variant stock
        if item.color_variant_id:
            variant = await db.product_color_variants.find_one({
                "id": item.color_variant_id,
                "product_id": item.product_id
            })
            if not variant:
                raise HTTPException(status_code=404, detail=f"Color variant not found")
            if variant["stock"] < item.quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']} - {variant['color_name']}")
            
            # Update variant stock
            await db.product_color_variants.update_one({"id": item.color_variant_id}, {"$inc": {"stock": -item.quantity}})
        else:
            # Use product-level stock
            if product["stock"] < item.quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
            await db.products.update_one({"id": item.product_id}, {"$inc": {"stock": -item.quantity}})
        
        price = product["discounted_price"] if product.get("discounted_price") else product["original_price"]
        total += price * item.quantity
        
        items_to_create.append({
            "product_id": product["id"],
            "color_variant_id": item.color_variant_id,
            "product_name": product["name"],
            "selected_color": item.selected_color,
            "selected_size": item.selected_size,
            "price": price,
            "quantity": item.quantity
        })

    # Calculate shipping cost
    shipping_cost = 0
    if total < 700 and total > 0:
        shipping_cost = 50
    elif total >= 700 and total <= 1200:
        shipping_cost = 30
    
    grand_total = total + shipping_cost

    # Combine address fields
    full_address = order_data.shipping_address
    if order_data.shipping_city: full_address += f", {order_data.shipping_city}"
    if order_data.shipping_state: full_address += f", {order_data.shipping_state}"
    if order_data.shipping_pincode: full_address += f" - {order_data.shipping_pincode}"

    # Generate Order ID
    count_doc = await db.counters.find_one({"_id": "orders"})
    if not count_doc:
        max_order = await db.orders.find_one(sort=[("id", -1)])
        start_val = max_order["id"] if max_order else 0
        await db.counters.update_one({"_id": "orders"}, {"$set": {"seq": start_val}}, upsert=True)
    
    new_id = await database.get_next_id(db, "orders")

    new_order = {
        "id": new_id,
        "user_id": current_user.id if current_user else None,
        "customer_name": order_data.customer_name,
        "customer_email": order_data.customer_email,
        "customer_phone": order_data.customer_phone,
        "address": full_address,
        "total_amount": grand_total,
        "status": "pending",
        "payment_method": order_data.payment_method,
        "created_at": datetime.utcnow()
    }
    
    await db.orders.insert_one(new_order)
    
    # Save order items
    for item in items_to_create:
        # Initialize order_items counter
        count_doc = await db.counters.find_one({"_id": "order_items"})
        if not count_doc:
            max_item = await db.order_items.find_one(sort=[("id", -1)])
            start_val = max_item["id"] if max_item else 0
            await db.counters.update_one({"_id": "order_items"}, {"$set": {"seq": start_val}}, upsert=True)
            
        item_id = await database.get_next_id(db, "order_items")
        item["id"] = item_id
        item["order_id"] = new_id
        await db.order_items.insert_one(item)
    
    new_order["items"] = items_to_create
    return new_order

@router.get("/orders", response_model=List[schemas.OrderResponse])
async def get_user_orders(current_user: Any = Depends(auth.get_current_user), db: Any = Depends(database.get_db)):
    orders = await db.orders.find({"user_id": current_user.id}).sort("created_at", -1).to_list(length=100)
    for order in orders:
        order["items"] = await db.order_items.find({"order_id": order["id"]}).to_list(length=100)
    return orders

@router.get("/orders/{order_id}", response_model=schemas.OrderResponse)
async def get_order(order_id: int, current_user: Any = Depends(auth.get_current_user), db: Any = Depends(database.get_db)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["user_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    order["items"] = await db.order_items.find({"order_id": order_id}).to_list(length=100)
    return order

@router.post("/orders/razorpay/create", response_model=schemas.RazorpayOrderResponse)
async def create_razorpay_payment(data: schemas.RazorpayOrderCreate, db: Any = Depends(database.get_db)):
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay not configured")
    order = await db.orders.find_one({"id": data.order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        rzp_order = razorpay_client.order.create({"amount": int(data.amount * 100), "currency": "INR", "receipt": f"order_{order['id']}"})
        await db.orders.update_one({"id": data.order_id}, {"$set": {"razorpay_order_id": rzp_order["id"]}})
        return {"razorpay_order_id": rzp_order["id"], "amount": data.amount, "currency": "INR", "key_id": settings.RAZORPAY_KEY_ID}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/orders/razorpay/verify")
async def verify_payment(data: schemas.RazorpayPaymentVerify, db: Any = Depends(database.get_db)):
    order = await db.orders.find_one({"id": data.order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    params_dict = {'razorpay_order_id': data.razorpay_order_id, 'razorpay_payment_id': data.razorpay_payment_id, 'razorpay_signature': data.razorpay_signature}
    try:
        razorpay_client.utility.verify_payment_signature(params_dict)
        await db.orders.update_one({"id": data.order_id}, {"$set": {"status": "confirmed", "razorpay_payment_id": data.razorpay_payment_id}})
        return {"message": "Success"}
    except Exception:
        raise HTTPException(status_code=400, detail="Payment verification failed")

@router.post("/orders/whatsapp", response_model=schemas.WhatsAppOrderResponse)
async def create_whatsapp_order(order_data: schemas.WhatsAppOrderCreate, db: Any = Depends(database.get_db), current_user: Optional[Any] = Depends(auth.get_current_user)):
    standard_data = schemas.OrderCreate(
        customer_name=order_data.customer_name, 
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone, 
        shipping_address=order_data.shipping_address,
        shipping_city=order_data.shipping_city,
        shipping_state=order_data.shipping_state,
        shipping_pincode=order_data.shipping_pincode,
        payment_method="whatsapp", 
        items=order_data.items
    )
    order = await create_order(standard_data, db, current_user)
    
    msg = f"🛍️ *New Order #{order['id']}*\n\n"
    msg += f"👤 *Customer:* {order['customer_name']}\n"
    msg += f"📞 *Phone:* {order['customer_phone']}\n"
    msg += f"📍 *Shipping Address:* {order['address']}\n\n"
    msg += f"💰 *Total Amount:* ₹{order['total_amount']}\n\n"
    msg += f"📦 *Items:*\n"
    
    for item in order["items"]:
        details = []
        if item.get("selected_color"): details.append(f"Color: {item['selected_color']}")
        if item.get("selected_size"): details.append(f"Size: {item['selected_size']}")
        detail_str = f" ({', '.join(details)})" if details else ""
        
        msg += f"• {item['product_name']} x {item['quantity']}{detail_str}\n"
    
    whatsapp_url = f"https://wa.me/{settings.WHATSAPP_BUSINESS_NUMBER}?text={quote(msg)}"
    return {"order_id": order["id"], "whatsapp_url": whatsapp_url, "message": msg}

@router.get("/admin/orders", response_model=List[schemas.OrderResponse])
async def get_all_orders_admin(admin: Any = Depends(auth.get_admin), db: Any = Depends(database.get_db)):
    orders = await db.orders.find().sort("created_at", -1).to_list(length=1000)
    for order in orders:
        order["items"] = await db.order_items.find({"order_id": order["id"]}).to_list(length=100)
    return orders

@router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: int, status_update: dict, admin: Any = Depends(auth.get_admin), db: Any = Depends(database.get_db)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    new_status = status_update.get("status", order["status"])
    await db.orders.update_one({"id": order_id}, {"$set": {"status": new_status}})
    return {"message": "Status updated"}
