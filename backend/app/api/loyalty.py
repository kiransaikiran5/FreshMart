from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..core.deps import get_current_user
from ..models.loyalty import LoyaltyTransaction
from ..schemas.loyalty import LoyaltyTransactionResponse, LoyaltyBalanceResponse

router = APIRouter(prefix="/loyalty", tags=["loyalty"])

@router.get("/balance", response_model=LoyaltyBalanceResponse)
async def get_balance(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    earned = await db.scalar(
        select(func.sum(LoyaltyTransaction.points_earned))
        .where(LoyaltyTransaction.user_id == current_user.id)
    ) or 0
    used = await db.scalar(
        select(func.sum(LoyaltyTransaction.points_used))
        .where(LoyaltyTransaction.user_id == current_user.id)
    ) or 0
    return {"points_balance": earned - used}

@router.get("/transactions", response_model=list[LoyaltyTransactionResponse])
async def get_transactions(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(
        select(LoyaltyTransaction)
        .where(LoyaltyTransaction.user_id == current_user.id)
        .order_by(LoyaltyTransaction.created_at.desc())
    )
    return result.scalars().all()