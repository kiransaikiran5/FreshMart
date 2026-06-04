from pydantic import BaseModel
from typing import Optional

class CartAdd(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    price: float
    quantity: int
    image: Optional[str] = None

    class Config:
        from_attributes = True

class CartResponse(BaseModel):
    id: int
    items: list[CartItemResponse] = []
    total: float

    class Config:
        from_attributes = True