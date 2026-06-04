from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
import datetime

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(String(500))
    category_id = Column(Integer, ForeignKey("categories.id"))
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0)
    image = Column(String(500))
    brand = Column(String(100), nullable=True)
    discount_percent = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    category = relationship("Category", back_populates="products")
    reviews = relationship("Review", back_populates="product")   # <-- must be singular "product"
    inventory = relationship("Inventory", back_populates="product", uselist=False)