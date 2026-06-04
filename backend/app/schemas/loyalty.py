from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LoyaltyTransactionResponse(BaseModel):
    id: int
    user_id: int
    points_earned: int
    points_used: int
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LoyaltyBalanceResponse(BaseModel):
    points_balance: int