from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum
from ..database import Base
import datetime
import enum
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

class DiscountType(str, enum.Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED = "FIXED"

class Coupon(Base):
    __tablename__ = "coupons"
    id = Column(Integer, primary_key=True, index=True)
    coupon_code = Column(String(50), unique=True, nullable=False)
    discount_type = Column(Enum(DiscountType), nullable=False)
    discount_value = Column(Float, nullable=False)
    minimum_order_amount = Column(Float, default=0.0)
    expiry_date = Column(DateTime, nullable=True)
    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    campaign = relationship("Campaign", backref="coupons")