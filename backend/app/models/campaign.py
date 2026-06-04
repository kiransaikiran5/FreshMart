from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Enum
from ..database import Base
import datetime
import enum

class DiscountType(str, enum.Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED = "FIXED"

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    discount_type = Column(Enum(DiscountType), nullable=False, default=DiscountType.PERCENTAGE)
    discount_value = Column(Float, nullable=False, default=0.0)
    minimum_order_amount = Column(Float, default=0.0)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)