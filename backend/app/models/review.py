from sqlalchemy import Column, Integer, String, SmallInteger, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from ..database import Base
import datetime

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    rating = Column(SmallInteger, nullable=False)
    review_text = Column(String(500))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    __table_args__ = (UniqueConstraint('user_id', 'product_id', name='uix_user_product'),)

    user = relationship("User")
    product = relationship("Product", back_populates="reviews")   # <-- back_populates matches Product.reviews