from pydantic import BaseModel, field_serializer
from typing import Optional
from datetime import datetime
from ..utils.timezone import utc_to_ist

class DeliveryResponse(BaseModel):
    id: int
    order_id: int
    delivery_address: str
    delivery_status: str
    estimated_time: Optional[datetime]

    class Config:
        from_attributes = True
        
    @field_serializer("estimated_time")
    def serialize_estimated_time(self, dt: Optional[datetime], _info):
        if dt:
            return utc_to_ist(dt)
        return None