from pydantic import BaseModel, field_validator, field_serializer
from datetime import datetime
from typing import Optional
from ..utils.timezone import utc_to_ist

class ProductCreate(BaseModel):
    """Used when creating a product via JSON (not used by the multipart endpoint)."""
    name: str
    description: Optional[str] = None
    category_id: int
    price: float
    stock_quantity: int
    image: Optional[str] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category_id: int
    price: float
    stock_quantity: int
    image: Optional[str] = None   # will be the full static URL
    is_active: bool
    brand: Optional[str] = None                  # new
    discount_percent: Optional[float] = 0.0      # new
    created_at: datetime

    # Convert a bare filename into a full static URL
    @field_validator("image", mode="before")
    @classmethod
    def build_image_url(cls, v):
        if not v:
            return None
        # If it’s already an absolute URL, leave it alone
        if v.startswith("http"):
            return v
        # Otherwise, v is a filename (e.g. "abc.jpg") → build the URL
        return f"http://localhost:8000/static/images/{v}"

    # Convert UTC datetime to IST for the API response
    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info):
        return utc_to_ist(dt)

    class Config:
        from_attributes = True