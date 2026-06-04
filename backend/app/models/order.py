from sqlalchemy import Column, Integer, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
import datetime
import enum

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_amount = Column(Float, nullable=False)
    order_status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    coupon_id = Column(Integer, ForeignKey("coupons.id"), nullable=True)
    discount_amount = Column(Float, default=0.0)

    items = relationship("OrderItem", back_populates="order")
    payment = relationship("Payment", uselist=False, back_populates="order")
    delivery = relationship("Delivery", uselist=False, back_populates="order")

    user = relationship("User", backref="orders")
    coupon = relationship("Coupon")
    return_requests = relationship("ReturnRequest", back_populates="order")
    

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    order = relationship("Order", back_populates="items")
    product = relationship("Product")