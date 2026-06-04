from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional

class CouponCreate(BaseModel):
    coupon_code: str
    discount_type: str          # "PERCENTAGE" or "FIXED"
    discount_value: float
    minimum_order_amount: float = 0.0
    expiry_date: Optional[datetime] = None
    usage_limit: Optional[int] = None
    is_active: bool = True

class CouponResponse(BaseModel):
    id: int
    coupon_code: str
    discount_type: str
    discount_value: float
    minimum_order_amount: float
    expiry_date: Optional[datetime] = None
    usage_limit: Optional[int] = None
    used_count: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CouponValidateRequest(BaseModel):
    coupon_code: str
    cart_total: float

class CouponValidateResponse(BaseModel):
    valid: bool
    message: str
    discount_amount: float = 0.0
    final_total: float = 0.0
    coupon: Optional[CouponResponse] = None