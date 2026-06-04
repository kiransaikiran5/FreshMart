from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from ..database import Base
import datetime

class Wishlist(Base):
    __tablename__ = "wishlists"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('user_id', 'product_id', name='uix_user_product_wishlist'),
    )

    user = relationship("User")
    product = relationship("Product")