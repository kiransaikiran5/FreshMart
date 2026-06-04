from datetime import datetime, timedelta

from jose import JWTError, jwt

from passlib.context import CryptContext

from ..config import settings


# =========================================================
# PASSWORD HASHING
# =========================================================
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


# =========================================================
# HASH PASSWORD
# =========================================================
def hash_password(password: str) -> str:
    """
    Hash plain password
    """

    return pwd_context.hash(password)


# =========================================================
# VERIFY PASSWORD
# =========================================================
def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    Verify password
    """

    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


# =========================================================
# CREATE ACCESS TOKEN
# =========================================================
def create_access_token(
    data: dict,
    expires_delta: timedelta = None,
) -> str:
    """
    Create JWT access token
    """

    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta
        or timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode.update(
        {
            "exp": expire,
            "type": "access",
        }
    )

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    return encoded_jwt


# =========================================================
# CREATE REFRESH TOKEN
# =========================================================
def create_refresh_token(
    data: dict,
    expires_delta: timedelta = None,
) -> str:
    """
    Create JWT refresh token
    """

    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta
        or timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    )

    to_encode.update(
        {
            "exp": expire,
            "type": "refresh",
        }
    )

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    return encoded_jwt


# =========================================================
# DECODE TOKEN
# =========================================================
def decode_token(token: str):
    """
    Decode JWT token
    """

    try:

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        return payload

    except JWTError:
        return None