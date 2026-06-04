from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from starlette.requests import Request
from authlib.integrations.starlette_client import OAuth
import secrets

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from ..database import get_db
from ..models.user import User
from ..config import settings
from ..schemas.auth import (
    UserRegister,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
    GoogleLoginRequest,
)
from ..core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ---------- Google OAuth (server‑side redirect) ----------
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile', 'redirect_uri': settings.GOOGLE_REDIRECT_URI},
)


# =========================================================
# REGISTER
# =========================================================
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    existing_user = await db.execute(
        select(User).where((User.username == user_in.username) | (User.email == user_in.email))
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username or email already exists")

    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role=user_in.role.upper(),   # stores "CUSTOMER" or "ADMIN" in DB
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# =========================================================
# LOGIN (email + password)
# =========================================================
@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # ✅ use .value for clean strings
    token_data = {
        "sub": str(user.id),
        "role": user.role.value,          # <-- fixed
        "email": user.email,
        "username": user.username,
    }
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
    }


# =========================================================
# TOKEN (Swagger)
# =========================================================
@router.post("/token", response_model=TokenResponse)
async def login_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token_data = {
        "sub": str(user.id),
        "role": user.role.value,          # fixed
        "email": user.email,
        "username": user.username,
    }
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
    }


# =========================================================
# REFRESH TOKEN
# =========================================================
@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    decoded = decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user_id = decoded.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = await db.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    token_data = {
        "sub": str(user.id),
        "role": user.role.value,          # fixed
        "email": user.email,
        "username": user.username,
    }
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
    }


# =========================================================
# GOOGLE LOGIN – Client‑side (works with the Google button)
# =========================================================
@router.post("/google-login", response_model=TokenResponse)
async def google_login_client(payload: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """Receive an ID token from the frontend, verify it, and issue JWT tokens."""
    try:
        google_user = id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            audience=settings.GOOGLE_CLIENT_ID,
        )
        email = google_user["email"]
        name = google_user.get("name", email.split("@")[0])
        google_id = google_user["sub"]
        avatar = google_user.get("picture")

        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is None:
            user = User(
                username=name.replace(" ", "").lower(),
                email=email,
                hashed_password=None,
                google_id=google_id,
                avatar=avatar,
                is_google_user=True,
                role="CUSTOMER",                # stored as string
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        token_data = {
            "sub": str(user.id),
            "role": user.role.value,            # fixed
            "email": user.email,
            "username": user.username,
        }
        return {
            "access_token": create_access_token(token_data),
            "refresh_token": create_refresh_token(token_data),
            "token_type": "bearer",
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google authentication failed: {str(e)}")


# =========================================================
# GOOGLE LOGIN – Server‑side redirect
# =========================================================
@router.get("/google/login")
async def google_login_server(request: Request):
    """Redirect user to Google OAuth consent screen."""
    state = secrets.token_urlsafe(16)
    request.session['oauth_state'] = state
    redirect_uri = str(request.url_for('google_callback_server'))
    return await oauth.google.authorize_redirect(request, redirect_uri, state=state)


@router.get("/google/callback")
async def google_callback_server(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle the callback from Google, create/find user, and redirect to frontend with tokens."""
    # Verify state
    state = request.session.get('oauth_state')
    if not state or state != request.query_params.get('state'):
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    # Exchange code for tokens
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get('userinfo')
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to get user info")

    email = user_info.get('email')
    name = user_info.get('name', email.split('@')[0])
    google_id = user_info.get('sub')
    avatar = user_info.get('picture')

    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            username=name.replace(" ", "").lower(),
            email=email,
            hashed_password=None,
            google_id=google_id,
            avatar=avatar,
            is_google_user=True,
            role="CUSTOMER",                    # stored as string
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token_data = {
        "sub": str(user.id),
        "role": user.role.value,                # fixed
        "email": user.email,
        "username": user.username,
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Redirect back to frontend with tokens in query params
    frontend_url = settings.FRONTEND_URL
    return RedirectResponse(
        url=f"{frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}"
    )