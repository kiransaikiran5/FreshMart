import datetime
import enum

from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class ReturnStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"


class ReturnRequest(Base):
    __tablename__ = "return_requests"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(String(500), nullable=False)
    status = Column(Enum(ReturnStatus), default=ReturnStatus.PENDING)
    refund_amount = Column(Float, default=0.0)
    admin_note = Column(String(500), nullable=True)

    # Corrected: pass the callable WITHOUT calling it
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    # Use back_populates for explicit bidirectional relationships
    order = relationship("Order", back_populates="return_requests")
    user = relationship("User", back_populates="return_requests")