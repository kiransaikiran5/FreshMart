from pydantic import BaseModel, field_serializer
from ..utils.timezone import utc_to_ist
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    
    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info):
        return utc_to_ist(dt)

    class Config:
        from_attributes = True