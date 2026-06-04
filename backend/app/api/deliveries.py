from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from ..database import get_db
from ..core.deps import get_current_user, role_required
from ..models.delivery import Delivery, DeliveryStatus          # ← import enum
from ..models.order import Order
from ..schemas.delivery import DeliveryResponse
from ..services.notification_service import create_notification

router = APIRouter(prefix="/deliveries", tags=["deliveries"])

@router.get("/{order_id}", response_model=DeliveryResponse)
async def get_delivery(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get delivery details for an order."""
    result = await db.execute(select(Delivery).where(Delivery.order_id == order_id))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return delivery

@router.put("/{order_id}")
async def update_delivery(
    order_id: int,
    status: str,
    estimated_time: str = None,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    """
    Admin updates delivery status and optionally estimated time.
    - `status` can be sent with spaces (e.g., "OUT FOR DELIVERY") – it will be normalised.
    - `estimated_time` must be a valid ISO datetime string (e.g., "2026-05-30T14:30:00").
    A notification is sent to the customer who owns the order.
    """
    result = await db.execute(select(Delivery).where(Delivery.order_id == order_id))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    # Normalise status: replace spaces with underscores, uppercase
    normalised_status = status.strip().replace(" ", "_").upper()

    # Validate that the normalised status is a valid DeliveryStatus enum value
    if normalised_status not in DeliveryStatus.__members__:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid delivery status. Allowed values: {', '.join(DeliveryStatus.__members__.keys())}"
        )

    delivery.delivery_status = normalised_status

    # Parse estimated_time only if a valid ISO string is given
    if estimated_time:
        try:
            delivery.estimated_time = datetime.fromisoformat(estimated_time)
        except ValueError:
            pass   # ignore invalid date strings

    # Fetch the associated order to send notification
    order = await db.get(Order, order_id)
    if order:
        await create_notification(
            db,
            user_id=order.user_id,
            title="Delivery Status Updated",
            message=f"Your order #{order_id} is now {normalised_status.replace('_', ' ').title()}.",
            type="DELIVERY",
        )

    await db.commit()
    return {"message": "Delivery updated"}