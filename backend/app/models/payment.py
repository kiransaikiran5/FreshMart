from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
import datetime
import enum

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    payment_method = Column(String(50))
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    amount = Column(Float, nullable=False)
    transaction_id = Column(String(100))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    order = relationship("Order", back_populates="payment")