"""
Order management and payment integration API endpoints
Handles order creation, Razorpay payments, WhatsApp orders, and order tracking
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import razorpay
import hmac
import hashlib
from urllib.parse import quote
from datetime import datetime

import models, schemas, auth, database
from config import settings

router = APIRouter(prefix="/api", tags=["Orders"])

# Initialize Razorpay client
razorpay_client = None
if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


# ==================== ORDER CREATION ====================
@router.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: schemas.OrderCreate,
    db: Session = Depends(database.get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user)
):
    """
    Create new order with stock validation
    Uses database transaction for atomicity
    """
    # Validate items and calculate total
    total_amount = 0
    discount_amount = 0
    order_items = []
    
    for item in order_data.items:
        # Get product
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id,
            models.Product.is_active == True
        ).first()
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found or inactive"
            )
        
        # Check stock availability
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {product.name}. Available: {product.stock}, Requested: {item.quantity}"
            )
        
        # Determine price
        unit_price = product.discounted_price if product.discounted_price and product.discounted_price > 0 else product.original_price
        item_total = unit_price * item.quantity
        
        # Track discount
        if product.discounted_price and product.discounted_price > 0:
            discount_amount += (product.original_price - product.discounted_price) * item.quantity
        
        total_amount += item_total
        
        # Create order item object
        order_items.append({
            "product_id": product.id,
            "product_name": product.name,
            "product_sku": product.sku,
            "selected_size": item.selected_size,
            "selected_color": item.selected_color,
            "unit_price": unit_price,
            "quantity": item.quantity,
            "total_price": item_total
        })
        
        # Deduct stock (will be committed with order)
        product.stock -= item.quantity
    
    # Create order
    final_amount = total_amount
    
    db_order = models.Order(
        user_id=current_user.id if current_user else None,
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        shipping_address=order_data.shipping_address,
        shipping_city=order_data.shipping_city,
        shipping_state=order_data.shipping_state,
        shipping_pincode=order_data.shipping_pincode,
        total_amount=total_amount,
        discount_amount=discount_amount,
        final_amount=final_amount,
        status=models.OrderStatus.PENDING,
        payment_method=order_data.payment_method,
        customer_notes=order_data.customer_notes
    )
    
    db.add(db_order)
    db.flush()  # Get order ID without committing
    
    # Create order items
    for item_data in order_items:
        order_item = models.OrderItem(
            order_id=db_order.id,
            **item_data
        )
        db.add(order_item)
    
    # Create payment record
    payment = models.Payment(
        order_id=db_order.id,
        payment_method=order_data.payment_method,
        payment_status=models.PaymentStatus.PENDING,
        amount=final_amount,
        currency="INR"
    )
    db.add(payment)
    
    # Commit transaction
    try:
        db.commit()
        db.refresh(db_order)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {str(e)}"
        )
    
    return db_order


# ==================== RAZORPAY INTEGRATION ====================
@router.post("/orders/razorpay/create", response_model=schemas.RazorpayOrderResponse)
async def create_razorpay_order(
    razorpay_data: schemas.RazorpayOrderCreate,
    db: Session = Depends(database.get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user)
):
    """
    Create Razorpay order for payment processing
    """
    if not razorpay_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay is not configured"
        )
    
    # Get order from database
    order = db.query(models.Order).filter(
        models.Order.id == razorpay_data.order_id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Verify amount matches
    if abs(order.final_amount - razorpay_data.amount) > 0.01:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount mismatch"
        )
    
    try:
        # Create Razorpay order
        razorpay_order = razorpay_client.order.create({
            "amount": int(razorpay_data.amount * 100),  # Convert to paise
            "currency": "INR",
            "receipt": f"order_{order.id}",
            "notes": {
                "order_id": str(order.id),
                "customer_name": order.customer_name
            }
        })
        
        # Update payment record
        payment = db.query(models.Payment).filter(
            models.Payment.order_id == order.id
        ).first()
        
        if payment:
            payment.razorpay_order_id = razorpay_order["id"]
            payment.payment_status = models.PaymentStatus.PROCESSING
            db.commit()
        
        return schemas.RazorpayOrderResponse(
            razorpay_order_id=razorpay_order["id"],
            amount=razorpay_data.amount,
            currency="INR",
            key_id=settings.RAZORPAY_KEY_ID
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create Razorpay order: {str(e)}"
        )


@router.post("/orders/razorpay/verify", response_model=schemas.MessageResponse)
async def verify_razorpay_payment(
    payment_data: schemas.RazorpayPaymentVerify,
    db: Session = Depends(database.get_db)
):
    """
    Verify Razorpay payment signature
    Updates order and payment status on success
    """
    if not razorpay_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay is not configured"
        )
    
    # Get order
    order = db.query(models.Order).filter(
        models.Order.id == payment_data.order_id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Get payment
    payment = db.query(models.Payment).filter(
        models.Payment.order_id == order.id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment record not found"
        )
    
    # Verify signature
    try:
        # Generate signature
        generated_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            f"{payment_data.razorpay_order_id}|{payment_data.razorpay_payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != payment_data.razorpay_signature:
            # Invalid signature
            payment.payment_status = models.PaymentStatus.FAILED
            payment.failure_reason = "Invalid payment signature"
            db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment verification failed"
            )
        
        # Payment verified successfully
        payment.razorpay_payment_id = payment_data.razorpay_payment_id
        payment.razorpay_signature = payment_data.razorpay_signature
        payment.payment_status = models.PaymentStatus.COMPLETED
        payment.completed_at = datetime.utcnow()
        
        # Update order status
        order.status = models.OrderStatus.CONFIRMED
        order.confirmed_at = datetime.utcnow()
        
        db.commit()
        
        return schemas.MessageResponse(
            message="Payment verified successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        payment.payment_status = models.PaymentStatus.FAILED
        payment.failure_reason = str(e)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification error: {str(e)}"
        )


# ==================== WHATSAPP INTEGRATION ====================
@router.post("/orders/whatsapp", response_model=schemas.WhatsAppOrderResponse)
async def create_whatsapp_order(
    order_data: schemas.WhatsAppOrderCreate,
    db: Session = Depends(database.get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user)
):
    """
    Create order and generate WhatsApp message URL
    """
    # Create order with WhatsApp payment method
    order_create = schemas.OrderCreate(
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        shipping_address=order_data.shipping_address,
        payment_method=schemas.PaymentMethod.WHATSAPP,
        items=order_data.items
    )
    
    # Reuse order creation logic
    order = await create_order(order_create, db, current_user)
    
    # Generate WhatsApp message
    message = f"*New Order from Burhani Collection*\n\n"
    message += f"*Order ID:* {order.id}\n"
    message += f"*Customer:* {order.customer_name}\n"
    message += f"*Phone:* {order.customer_phone}\n"
    message += f"*Address:* {order.shipping_address}\n\n"
    message += f"*Items:*\n"
    
    for item in order.items:
        message += f"• {item.product_name}"
        if item.selected_size or item.selected_color:
            message += f" ("
            if item.selected_size:
                message += f"{item.selected_size}"
            if item.selected_color:
                if item.selected_size:
                    message += f" | "
                message += f"{item.selected_color}"
            message += f")"
        message += f" x {item.quantity} - ₹{item.total_price:.2f}\n"
    
    message += f"\n*Total Amount:* ₹{order.final_amount:.2f}\n"
    message += f"*Payment:* Cash on Delivery\n\n"
    message += f"Please confirm this order. Thank you!"
    
    # Create WhatsApp URL
    encoded_message = quote(message)
    whatsapp_url = f"https://api.whatsapp.com/send?phone={settings.WHATSAPP_BUSINESS_NUMBER}&text={encoded_message}"
    
    return schemas.WhatsAppOrderResponse(
        order_id=order.id,
        whatsapp_url=whatsapp_url,
        message=message
    )


# ==================== ORDER MANAGEMENT ====================
@router.get("/orders", response_model=List[schemas.OrderResponse])
async def get_user_orders(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
    limit: int = 50
):
    """Get current user's orders"""
    orders = db.query(models.Order).filter(
        models.Order.user_id == current_user.id
    ).order_by(models.Order.created_at.desc()).limit(limit).all()
    
    return orders


@router.get("/orders/{order_id}", response_model=schemas.OrderResponse)
async def get_order(
    order_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get specific order details"""
    order = db.query(models.Order).filter(
        models.Order.id == order_id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Verify ownership (unless admin)
    if current_user.role != models.UserRole.ADMIN and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return order


@router.get("/admin/orders", response_model=List[schemas.OrderResponse])
async def get_all_orders(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user),
    status_filter: Optional[str] = None,
    limit: int = 100
):
    """Get all orders (admin only)"""
    query = db.query(models.Order)
    
    if status_filter:
        query = query.filter(models.Order.status == status_filter)
    
    orders = query.order_by(models.Order.created_at.desc()).limit(limit).all()
    return orders


@router.put("/admin/orders/{order_id}/status", response_model=schemas.OrderResponse)
async def update_order_status(
    order_id: int,
    status_update: schemas.OrderStatusUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Update order status (admin only)"""
    order = db.query(models.Order).filter(
        models.Order.id == order_id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Update status
    order.status = status_update.status
    
    # Update timestamps based on status
    if status_update.status == models.OrderStatus.CONFIRMED and not order.confirmed_at:
        order.confirmed_at = datetime.utcnow()
    elif status_update.status == models.OrderStatus.SHIPPED and not order.shipped_at:
        order.shipped_at = datetime.utcnow()
    elif status_update.status == models.OrderStatus.DELIVERED and not order.delivered_at:
        order.delivered_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    return order
