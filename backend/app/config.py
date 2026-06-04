from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # =========================================
    # GOOGLE OAUTH
    # =========================================
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:5173"

    # =========================================
    # CASHFREE PAYMENTS
    # =========================================
    CASHFREE_APP_ID: str = ""
    CASHFREE_SECRET_KEY: str = ""
    CASHFREE_ENV: str = "sandbox"

    class Config:
        env_file = ".env"

settings = Settings()