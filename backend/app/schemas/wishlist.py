from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class WishlistItemCreate(BaseModel):
    product_id: int

class WishlistItemResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    product_name: str
    product_price: float
    product_image: Optional[str] = None
    stock_quantity: int
    created_at: datetime

    class Config:
        from_attributes = True