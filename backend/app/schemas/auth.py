from datetime import datetime
from pydantic import BaseModel, EmailStr, field_serializer
from typing import Optional


# =========================================================
# USER REGISTER (email + password)
# =========================================================
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "CUSTOMER"


# =========================================================
# USER LOGIN (email + password)
# =========================================================
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# =========================================================
# GOOGLE LOGIN (client‑side ID token – kept for future use)
# =========================================================
class GoogleLoginRequest(BaseModel):
    credential: str          # the ID token from Google


# =========================================================
# TOKEN RESPONSE
# =========================================================
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# =========================================================
# REFRESH TOKEN REQUEST
# =========================================================
class RefreshTokenRequest(BaseModel):
    refresh_token: str


# =========================================================
# USER RESPONSE
# =========================================================
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    avatar: Optional[str] = None       # new
    is_google_user: bool = False       # new
    created_at: datetime

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info):
        return dt.strftime("%Y-%m-%d %I:%M:%S %p")

    class Config:
        from_attributes = True