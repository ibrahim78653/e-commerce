from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, auth, database
from typing import List, Optional
import razorpay
from urllib.parse import quote
from config import settings

router = APIRouter(prefix="/api", tags=["Orders"])

razorpay_client = None
if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

@router.post("/orders", response_model=schemas.OrderResponse)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(database.get_db), current_user: Optional[models.User] = Depends(auth.get_current_user)):
    total = 0
    items_to_create = []
    
    for item in order_data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
        
        price = product.discounted_price if product.discounted_price else product.original_price
        total += price * item.quantity
        
        items_to_create.append(models.OrderItem(
            product_id=product.id,
            product_name=product.name,
            price=price,
            quantity=item.quantity
        ))
        product.stock -= item.quantity

    new_order = models.Order(
        user_id=current_user.id if current_user else None,
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        address=order_data.shipping_address,
        total_amount=total,
        payment_method=order_data.payment_method
    )
    db.add(new_order)
    db.flush()
    
    for item in items_to_create:
        item.order_id = new_order.id
        db.add(item)
    
    db.commit()
    db.refresh(new_order)
    return new_order

@router.get("/orders", response_model=List[schemas.OrderResponse])
def get_user_orders(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Order).filter(models.Order.user_id == current_user.id).all()

@router.get("/orders/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return order

@router.post("/orders/razorpay/create", response_model=schemas.RazorpayOrderResponse)
def create_razorpay_payment(data: schemas.RazorpayOrderCreate, db: Session = Depends(database.get_db)):
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay not configured")
    order = db.query(models.Order).filter(models.Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        rzp_order = razorpay_client.order.create({"amount": int(data.amount * 100), "currency": "INR", "receipt": f"order_{order.id}"})
        order.razorpay_order_id = rzp_order["id"]
        db.commit()
        return {"razorpay_order_id": rzp_order["id"], "amount": data.amount, "currency": "INR", "key_id": settings.RAZORPAY_KEY_ID}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/orders/razorpay/verify")
def verify_payment(data: schemas.RazorpayPaymentVerify, db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    params_dict = {'razorpay_order_id': data.razorpay_order_id, 'razorpay_payment_id': data.razorpay_payment_id, 'razorpay_signature': data.razorpay_signature}
    try:
        razorpay_client.utility.verify_payment_signature(params_dict)
        order.status = "confirmed"
        order.razorpay_payment_id = data.razorpay_payment_id
        db.commit()
        return {"message": "Success"}
    except Exception:
        raise HTTPException(status_code=400, detail="Payment verification failed")

@router.post("/orders/whatsapp", response_model=schemas.WhatsAppOrderResponse)
def create_whatsapp_order(order_data: schemas.WhatsAppOrderCreate, db: Session = Depends(database.get_db), current_user: Optional[models.User] = Depends(auth.get_current_user)):
    standard_data = schemas.OrderCreate(customer_name=order_data.customer_name, customer_phone=order_data.customer_phone, shipping_address=order_data.shipping_address, payment_method="whatsapp", items=order_data.items)
    order = create_order(standard_data, db, current_user)
    msg = f"New Order #{order.id}\nCustomer: {order.customer_name}\nTotal: {order.total_amount}\nItems:\n"
    for item in order.items:
        msg += f"- {item.product_name} x {item.quantity}\n"
    whatsapp_url = f"https://wa.me/{settings.WHATSAPP_BUSINESS_NUMBER}?text={quote(msg)}"
    return {"order_id": order.id, "whatsapp_url": whatsapp_url, "message": msg}

@router.get("/admin/orders", response_model=List[schemas.OrderResponse])
def get_all_orders_admin(admin: models.User = Depends(auth.get_admin), db: Session = Depends(database.get_db)):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()

@router.put("/admin/orders/{order_id}/status")
def update_order_status(order_id: int, status_update: dict, admin: models.User = Depends(auth.get_admin), db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status_update.get("status", order.status)
    db.commit()
    return {"message": "Status updated"}
