from sqlalchemy import Column, Integer, DateTime, ForeignKey, String
from ..database import Base
import datetime

class LoyaltyTransaction(Base):
    __tablename__ = "loyalty_transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    points_earned = Column(Integer, default=0)
    points_used = Column(Integer, default=0)
    description = Column(String(200), nullable=True)  # e.g., "Order #5", "Redemption"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)