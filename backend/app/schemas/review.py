from pydantic import BaseModel, field_validator, field_serializer
from datetime import datetime
from typing import Optional
from ..utils.timezone import utc_to_ist

class ReviewCreate(BaseModel):
    product_id: int
    rating: int
    review_text: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v):
        if v < 1 or v > 5:
            raise ValueError("Rating must be between 1 and 5")
        return v

class ReviewResponse(BaseModel):
    id: int
    user_id: int
    username: str
    product_id: int
    rating: int
    review_text: Optional[str]
    created_at: datetime

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info):
        return utc_to_ist(dt)

    class Config:
        from_attributes = True