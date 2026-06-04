from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
import httpx
import uuid

from ..config import settings
from ..database import get_db
from ..core.deps import get_current_user
from ..models.order import Order, OrderStatus
from ..models.payment import Payment, PaymentStatus
from ..models.loyalty import LoyaltyTransaction
from ..services.notification_service import create_notification

router = APIRouter(prefix="/payments", tags=["payments"])

CASHFREE_BASE_URL = "https://sandbox.cashfree.com/pg"


async def _cashfree_request(endpoint: str, payload: dict) -> dict:
    headers = {
        "x-client-id": settings.CASHFREE_APP_ID,
        "x-client-secret": settings.CASHFREE_SECRET_KEY,
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{CASHFREE_BASE_URL}{endpoint}", json=payload, headers=headers, timeout=30.0)
        if resp.status_code >= 400:
            raise HTTPException(status_code=500, detail=resp.text)
        return resp.json()


# ---------- Create / Retry a Cashfree order ----------
@router.post("/create-order")
async def create_order(order_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your order")
    if order.order_status != OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail="Order cannot be paid")

    # Check for an existing payment
    existing = await db.execute(select(Payment).where(Payment.order_id == order.id))
    payment = existing.scalar_one_or_none()

    # Only block if the payment was already successful
    if payment and payment.payment_status == PaymentStatus.SUCCESS:
        raise HTTPException(status_code=400, detail="Payment already successful")

    # Always create a fresh Cashfree session
    cf_order_id = f"CF_{order.id}_{uuid.uuid4().hex[:8]}"
    payload = {
        "order_id": cf_order_id,
        "order_amount": order.total_amount,
        "order_currency": "INR",
        "order_meta": {"business_name": "FreshMart", "notify_url": ""},
        "customer_details": {
            "customer_id": str(current_user.id),
            "customer_email": current_user.email,
            "customer_phone": "9999999999",
        },
    }

    try:
        data = await _cashfree_request("/orders", payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Update existing payment or create a new one – catch duplicate
    try:
        if payment:
            payment.transaction_id = cf_order_id
            payment.payment_status = PaymentStatus.PENDING
        else:
            payment = Payment(
                order_id=order.id,
                payment_method="CASHFREE",
                payment_status=PaymentStatus.PENDING,
                amount=order.total_amount,
                transaction_id=cf_order_id,
            )
            db.add(payment)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        # The payment already existed (race condition) – fetch it and update
        result = await db.execute(select(Payment).where(Payment.order_id == order.id))
        payment = result.scalar_one()
        payment.transaction_id = cf_order_id
        payment.payment_status = PaymentStatus.PENDING
        await db.commit()

    return {
        "payment_session_id": data["payment_session_id"],
        "cf_order_id": cf_order_id,
    }


# ---------- Verify (with fallback and direct order update) ----------
@router.post("/verify")
async def verify_payment(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    body = await request.json()

    cf_order_id = body.get("order_id")

    if not cf_order_id:
        raise HTTPException(
            status_code=400,
            detail="Missing order id"
        )

    headers = {
        "x-client-id": settings.CASHFREE_APP_ID,
        "x-client-secret": settings.CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{CASHFREE_BASE_URL}/orders/{cf_order_id}",
            headers=headers,
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail="Failed to verify payment"
        )

    cf_data = resp.json()

    order_status = cf_data.get("order_status")

    result = await db.execute(
        select(Payment)
        .where(Payment.transaction_id == cf_order_id)
    )

    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    order = await db.get(
        Order,
        payment.order_id
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    if order_status == "PAID":

        payment.payment_status = PaymentStatus.SUCCESS

        order.order_status = OrderStatus.CONFIRMED

        points = int(
            order.total_amount // 10
        )

        if points > 0:
            db.add(
                LoyaltyTransaction(
                    user_id=order.user_id,
                    points_earned=points,
                    description=f"Order #{order.id}"
                )
            )

        await create_notification(
            db,
            order.user_id,
            "Payment Successful",
            f"Payment for order #{order.id} was successful.",
            "PAYMENT",
        )

    else:

        payment.payment_status = PaymentStatus.FAILED

        await create_notification(
            db,
            order.user_id,
            "Payment Failed",
            f"Payment for order #{order.id} failed.",
            "PAYMENT",
        )

    await db.commit()

    return {
        "success": order_status == "PAID",
        "order_status": order_status,
        "order_id": order.id,
    }