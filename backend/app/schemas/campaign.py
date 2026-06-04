from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional

class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    discount_type: str = "PERCENTAGE"
    discount_value: float
    minimum_order_amount: float = 0.0
    start_date: datetime
    end_date: datetime
    is_active: bool = True

class CampaignResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    discount_type: str
    discount_value: float
    minimum_order_amount: float
    start_date: datetime
    end_date: datetime
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CampaignPerformance(BaseModel):
    campaign_id: int
    campaign_name: str
    total_orders: int
    total_discount: float
    total_revenue: float
    coupon_usage_count: int