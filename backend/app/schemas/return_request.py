from pydantic import BaseModel, field_serializer
from datetime import datetime
from typing import Optional
from ..utils.timezone import utc_to_ist

class ReturnRequestCreate(BaseModel):
    order_id: int          
    reason: str

class ReturnRequestResponse(BaseModel):
    id: int
    order_id: int
    user_id: int
    user_email: Optional[str] = None
    reason: str
    status: str
    refund_amount: Optional[float] = 0.0  
    admin_note: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None 
    
    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info):
        return utc_to_ist(dt)

    @field_serializer("updated_at")
    def serialize_updated_at(self, dt: Optional[datetime], _info):
        if dt:
            return utc_to_ist(dt)
        return None

    class Config:
        from_attributes = True

class ReturnRequestUpdate(BaseModel):
    status: Optional[str] = None
    admin_note: Optional[str] = None