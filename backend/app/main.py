from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
import os

from .config import settings          # ← import your settings

app = FastAPI(title="FreshMart API")

# ---------------------------------------------------------------
# 1. HARD‑RESET THE MIDDLEWARE STORE (must be first)
# ---------------------------------------------------------------
app.user_middleware = []          # remove all stored middleware
app.middleware_stack = None       # force full rebuild on the next request

# ---------------------------------------------------------------
# 2. SessionMiddleware (needed by Google OAuth state)
# ---------------------------------------------------------------
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# ---------------------------------------------------------------
# 3. CORS middleware
# ---------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------
# 4. Mount static files
# ---------------------------------------------------------------
os.makedirs("static/images", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# ---------------------------------------------------------------
# 5. Database startup
# ---------------------------------------------------------------
@app.on_event("startup")
async def startup():
    from .database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ FreshMart API is ready!")

# ---------------------------------------------------------------
# 6. Import & register ALL routers
# ---------------------------------------------------------------
from .api import (
    auth, products, cart, orders, payments, deliveries,
    reviews, notifications, admin, chat, inventory, categories,
    coupons, wishlist, loyalty, returns, delivery_slots,
    recommendations, campaigns, analytics,
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(cart.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(deliveries.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(coupons.router, prefix="/api/v1")
app.include_router(wishlist.router, prefix="/api/v1")
app.include_router(loyalty.router, prefix="/api/v1")
app.include_router(returns.router, prefix="/api/v1")
app.include_router(delivery_slots.router, prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(campaigns.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "FreshMart API running"}

@app.get("/health")
async def health():
    return {"status": "ok"}