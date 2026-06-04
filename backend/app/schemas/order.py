from pydantic import BaseModel, field_serializer
from ..utils.timezone import utc_to_ist
from datetime import datetime
from typing import List, Optional

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    price: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    total_amount: float
    order_status: str
    created_at: datetime
    items: List[OrderItemResponse] = []
    user_email: Optional[str] = None
    user_username: Optional[str] = None

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info):
        return utc_to_ist(dt)

    class Config:
        from_attributes = True