from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..core.deps import get_current_user, role_required
from ..models.cart import Cart, CartItem
from ..models.order import Order, OrderItem, OrderStatus
from ..models.product import Product
from ..models.inventory import Inventory
from ..models.delivery import Delivery
from ..models.coupon import Coupon, DiscountType
from ..models.loyalty import LoyaltyTransaction
from ..models.delivery_slot import DeliverySlot                          # <-- new import
from ..models.return_request import ReturnRequest, ReturnStatus as ReturnReqStatus
from ..services.notification_service import create_notification
from ..schemas.order import OrderResponse, OrderItemResponse
from ..schemas.return_request import ReturnRequestCreate

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/place", status_code=status.HTTP_200_OK)
async def place_order(
    delivery_address: str = Query("Default Address", description="Delivery address"),
    coupon_code: Optional[str] = Query(None, description="Optional coupon code"),
    use_points: int = Query(0, ge=0, description="Loyalty points to redeem (1 point = ₹1)"),
    slot_id: Optional[int] = Query(None, description="Delivery slot ID"),   # <-- new parameter
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Place an order from the user's cart.
    - Optionally apply a coupon code.
    - Optionally redeem loyalty points.
    - Optionally select a delivery slot.
    - Validates stock, reduces inventory, creates delivery, clears cart, sends notifications.
    """
    # 1. Fetch user's cart with items
    cart_result = await db.execute(
        select(Cart)
        .options(selectinload(Cart.items))
        .where(Cart.user_id == current_user.id)
    )
    cart = cart_result.scalar_one_or_none()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # 2. Validate stock, lock rows, calculate subtotal
    subtotal = 0.0
    order_items_data = []

    for ci in cart.items:
        product = await db.get(Product, ci.product_id, with_for_update=True)
        if not product or not product.is_active:
            raise HTTPException(status_code=400, detail=f"Product {ci.product_id} is unavailable")
        if product.stock_quantity < ci.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

        # Lock and validate inventory
        inv_result = await db.execute(
            select(Inventory)
            .with_for_update()
            .where(Inventory.product_id == ci.product_id)
        )
        inventory = inv_result.scalar_one_or_none()
        if inventory and inventory.available_stock < ci.quantity:
            raise HTTPException(status_code=400, detail=f"Inventory shortage for {product.name}")

        # Decrement stocks
        product.stock_quantity -= ci.quantity
        if inventory:
            inventory.available_stock -= ci.quantity

        order_items_data.append({
            "product_id": ci.product_id,
            "quantity": ci.quantity,
            "price": product.price,
        })
        subtotal += product.price * ci.quantity

    # 3. Apply coupon (if any)
    discount = 0.0
    coupon = None
    if coupon_code:
        coupon_result = await db.execute(
            select(Coupon).where(Coupon.coupon_code == coupon_code.strip().upper())
        )
        coupon = coupon_result.scalar_one_or_none()
        if not coupon or not coupon.is_active:
            raise HTTPException(status_code=400, detail="Invalid or inactive coupon")
        if coupon.expiry_date and coupon.expiry_date < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Coupon has expired")
        if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
            raise HTTPException(status_code=400, detail="Coupon usage limit reached")
        if subtotal < coupon.minimum_order_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum order amount of ₹{coupon.minimum_order_amount:.2f} required",
            )

        if coupon.discount_type == DiscountType.PERCENTAGE:
            discount = round((subtotal * coupon.discount_value) / 100, 2)
        else:
            discount = coupon.discount_value

        # Increment usage count
        coupon.used_count += 1
        db.add(coupon)

    # 4. Apply loyalty points redemption
    points_discount = 0.0
    if use_points > 0:
        # Calculate user's current points balance
        earned = await db.scalar(
            select(func.sum(LoyaltyTransaction.points_earned))
            .where(LoyaltyTransaction.user_id == current_user.id)
        ) or 0
        used = await db.scalar(
            select(func.sum(LoyaltyTransaction.points_used))
            .where(LoyaltyTransaction.user_id == current_user.id)
        ) or 0
        balance = earned - used

        if use_points > balance:
            raise HTTPException(status_code=400, detail="Insufficient loyalty points")

        # The actual discount cannot exceed the remaining total after coupon
        max_possible = subtotal - discount
        points_discount = min(use_points, max_possible)

        if points_discount > 0:
            db.add(LoyaltyTransaction(
                user_id=current_user.id,
                points_used=points_discount,
                description=f"Redemption on order"
            ))

    final_total = subtotal - discount - points_discount
    if final_total < 0:
        final_total = 0

    # 5. Create order
    order = Order(
        user_id=current_user.id,
        total_amount=final_total,
        order_status=OrderStatus.PENDING,
        coupon_id=coupon.id if coupon else None,
        discount_amount=discount + points_discount,
    )
    db.add(order)
    await db.flush()

    # 6. Create order items
    for oi in order_items_data:
        db.add(OrderItem(order_id=order.id, **oi))

    # 7. Create delivery record (with optional slot)
    delivery = Delivery(
        order_id=order.id,
        delivery_address=delivery_address,
        delivery_status="PREPARING",
        slot_id=slot_id,                     # <-- attach selected slot
    )
    db.add(delivery)

    # 8. Handle slot capacity
    if slot_id:
        slot = await db.get(DeliverySlot, slot_id)
        if not slot or slot.available_capacity < 1:
            raise HTTPException(status_code=400, detail="Selected delivery slot is unavailable")
        slot.available_capacity -= 1
        db.add(slot)

    # 9. Clear cart
    for ci in cart.items:
        await db.delete(ci)
    await db.delete(cart)

    # 10. Send notification
    msg = f"Your order #{order.id} has been placed. Total: ₹{final_total:.2f}"
    if coupon:
        msg += f" (coupon applied: {coupon.coupon_code})"
    if points_discount > 0:
        msg += f" (loyalty points used: {points_discount})"
    if slot_id:
        msg += f" (delivery slot #{slot_id})"
    await create_notification(db, current_user.id, "Order Placed", msg, "ORDER")

    # 11. Commit everything
    await db.commit()

    return {
        "message": "Order placed successfully",
        "order_id": order.id,
        "total": final_total,
        "coupon_discount": discount,
        "points_redeemed": points_discount,
        "coupon_code": coupon.coupon_code if coupon else None,
    }


@router.get("/", response_model=list[OrderResponse])
async def get_orders(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retrieve all orders for the current user, with items."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .where(Order.user_id == current_user.id)
        .order_by(Order.id.desc())
    )
    orders = result.scalars().all()

    response = []
    for order in orders:
        items = [
            OrderItemResponse(
                id=oi.id,
                product_id=oi.product_id,
                product_name=oi.product.name if oi.product else "N/A",
                quantity=oi.quantity,
                price=oi.price,
            )
            for oi in order.items
        ]
        response.append(OrderResponse(
            id=order.id,
            total_amount=order.total_amount,
            order_status=order.order_status,
            created_at=order.created_at,
            items=items,
        ))
    return response


@router.put("/{order_id}/status", status_code=status.HTTP_200_OK)
async def update_order_status(
    order_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN")),
):
    """Admin updates the order status."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        new_status = OrderStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")

    order.order_status = new_status
    await db.commit()
    return {"message": f"Order status updated to {status}"}


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Customer cancels their own order (only if PENDING or CONFIRMED)."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your order")
    if order.order_status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
        raise HTTPException(
            status_code=400,
            detail="Order cannot be cancelled (only PENDING or CONFIRMED orders)",
        )

    order.order_status = OrderStatus.CANCELLED
    await db.commit()
    return {"message": f"Order #{order_id} has been cancelled"}


@router.post("/{order_id}/return")
async def request_return(
    order_id: int,
    return_in: ReturnRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Customer requests a return for a delivered order."""
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your order")
    if order.order_status != OrderStatus.DELIVERED:
        raise HTTPException(
            status_code=400,
            detail="Only delivered orders can be returned",
        )

    # Check if a return request already exists
    existing = await db.execute(
        select(ReturnRequest).where(ReturnRequest.order_id == order_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Return request already exists for this order")

    return_req = ReturnRequest(
        order_id=order_id,
        user_id=current_user.id,
        reason=return_in.reason,
        status=ReturnReqStatus.PENDING,
    )
    db.add(return_req)
    await db.commit()
    return {"message": "Return request submitted", "id": return_req.id}