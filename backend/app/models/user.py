from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from ..database import Base
import datetime
import enum

class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)

    # Password login
    hashed_password = Column(String(255), nullable=True)      # null for Google-only users

    # Google OAuth
    google_id = Column(String(255), unique=True, nullable=True)
    is_google_user = Column(Boolean, default=False)           # changed to Boolean

    avatar = Column(String(500), nullable=True)

    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    return_requests = relationship("ReturnRequest", back_populates="user")