from pydantic import BaseModel
from datetime import time

class DeliverySlotCreate(BaseModel):
    slot_name: str
    start_time: time
    end_time: time
    available_capacity: int = 10

class DeliverySlotResponse(BaseModel):
    id: int
    slot_name: str
    start_time: time
    end_time: time
    available_capacity: int

    class Config:
        from_attributes = True