from pydantic import BaseModel
from datetime import datetime

class InventoryResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    available_stock: int
    updated_at: datetime

    class Config:
        from_attributes = True

class InventoryAlertResponse(BaseModel):
    product_id: int
    product_name: str
    available_stock: int
    threshold: int = 10
    message: str