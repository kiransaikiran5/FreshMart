from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..core.deps import get_current_user, role_required
from ..models.return_request import ReturnRequest, ReturnStatus
from ..models.order import Order, OrderStatus
from ..models.payment import Payment, PaymentStatus
from ..schemas.return_request import ReturnRequestCreate, ReturnRequestResponse

router = APIRouter(prefix="/returns", tags=["returns"])


# ---------- Customer: Request a return / refund ----------
@router.post("/", response_model=ReturnRequestResponse, status_code=status.HTTP_201_CREATED)
async def request_return(
    req: ReturnRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Request a return for a delivered order, or a refund for a cancelled order that was paid."""
    order = await db.get(Order, req.order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")

    # Allow for DELIVERED or CANCELLED with successful payment
    if order.order_status == OrderStatus.DELIVERED:
        pass
    elif order.order_status == OrderStatus.CANCELLED:
        payment_result = await db.execute(
            select(Payment).where(
                Payment.order_id == order.id,
                Payment.payment_status == PaymentStatus.SUCCESS
            )
        )
        if not payment_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="No successful payment found for this cancelled order")
    else:
        raise HTTPException(status_code=400, detail="Return/refund can only be requested for delivered or cancelled (paid) orders")

    # Prevent duplicate requests
    existing = await db.execute(
        select(ReturnRequest).where(ReturnRequest.order_id == req.order_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Return/refund request already exists for this order")

    return_req = ReturnRequest(
        order_id=req.order_id,
        user_id=current_user.id,
        reason=req.reason,
        refund_amount=order.total_amount
    )
    db.add(return_req)
    await db.commit()
    await db.refresh(return_req)
    return return_req


# ---------- Customer: View own return/refund requests ----------
@router.get("/", response_model=list[ReturnRequestResponse])
async def get_my_returns(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(
        select(ReturnRequest)
        .where(ReturnRequest.user_id == current_user.id)
        .order_by(ReturnRequest.created_at.desc())
    )
    return result.scalars().all()


# ---------- Admin: View all return/refund requests ----------
@router.get("/admin", response_model=list[ReturnRequestResponse])
async def get_all_returns(
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    result = await db.execute(
        select(ReturnRequest)
        .options(selectinload(ReturnRequest.order), selectinload(ReturnRequest.user))
        .order_by(ReturnRequest.created_at.desc())
    )
    returns = result.scalars().all()

    response = []
    for ret in returns:
        response.append({
            "id": ret.id,
            "order_id": ret.order_id,
            "user_id": ret.user_id,
            "user_email": ret.user.email if ret.user else None,
            "reason": ret.reason,
            "refund_amount": ret.refund_amount,
            "status": ret.status.value,   # convert enum to string
            "admin_note": ret.admin_note,
            "created_at": ret.created_at,
            "updated_at": ret.updated_at,
        })
    return response


# ---------- Admin: Update return/refund status ----------
@router.put("/{return_id}/status", response_model=ReturnRequestResponse)
async def update_return_status(
    return_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    return_req = await db.get(ReturnRequest, return_id)
    if not return_req:
        raise HTTPException(status_code=404, detail="Return request not found")

    try:
        new_status = ReturnStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")

    return_req.status = new_status
    await db.commit()
    await db.refresh(return_req)
    return return_req