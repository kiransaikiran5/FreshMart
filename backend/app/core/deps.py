from fastapi import (
    Depends,
    HTTPException,
    status,
)

from fastapi.security import OAuth2PasswordBearer

from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select

from ..database import get_db

from ..models.user import User

from .security import decode_token


# =========================================================
# OAUTH2 SCHEME
# =========================================================
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)


# =========================================================
# GET CURRENT USER
# =========================================================
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Validate JWT token
    and return current user
    """

    # Decode token
    payload = decode_token(token)

    # Invalid token
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Token type validation
    token_type = payload.get("type")

    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        )

    # Get user ID
    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Find user
    result = await db.execute(
        select(User).where(
            User.id == int(user_id)
        )
    )

    user = result.scalar_one_or_none()

    # User not found
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


# =========================================================
# ROLE REQUIRED
# =========================================================
def role_required(required_role: str):
    """
    Role-based authorization
    Case insensitive
    """

    async def role_checker(
        current_user: User = Depends(get_current_user),
    ):

        # Normalize database role
        user_role = (
            current_user.role
            .strip()
            .lower()
        )

        # Normalize required role
        required = (
            required_role
            .strip()
            .lower()
        )

        # Compare roles
        if user_role != required:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access denied. "
                    f"Required role: {required}. "
                    f"Your role: {user_role}"
                ),
            )

        return current_user

    return role_checker