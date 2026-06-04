from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
import datetime
import enum

class DeliveryStatus(str, enum.Enum):
    PREPARING = "PREPARING"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"

class Delivery(Base):
    __tablename__ = "deliveries"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    delivery_address = Column(String(200), nullable=False)
    delivery_status = Column(Enum(DeliveryStatus), default=DeliveryStatus.PREPARING)
    estimated_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    order = relationship("Order", back_populates="delivery")
    slot_id = Column(Integer, ForeignKey("delivery_slots.id"), nullable=True)
    slot = relationship("DeliverySlot")