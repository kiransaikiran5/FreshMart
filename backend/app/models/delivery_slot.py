from sqlalchemy import Column, Integer, String, Time
from ..database import Base

class DeliverySlot(Base):
    __tablename__ = "delivery_slots"

    id = Column(Integer, primary_key=True, index=True)
    slot_name = Column(String(100), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    available_capacity = Column(Integer, default=10)