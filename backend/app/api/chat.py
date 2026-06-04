from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
import re

from ..database import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..models.order import Order, OrderStatus
from ..models.delivery import Delivery
from ..models.product import Product
from ..models.category import Category
from ..schemas.order import OrderResponse, OrderItemResponse

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatMessage(BaseModel):
    message: str

# ---------- Helper: extract order ID from text ----------
def extract_order_id(text: str) -> Optional[int]:
    # match patterns like #123, order 123, order #123
    match = re.search(r'(?:order\s*)?#?\s*(\d+)', text, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None

# ---------- Helper: build a quick order status reply ----------
async def get_order_status_reply(db, user: User, order_id: Optional[int] = None) -> str:
    if order_id:
        order = await db.get(Order, order_id)
        if not order or order.user_id != user.id:
            return f"I couldn't find order #{order_id} in your account. Please check the order number."
        delivery = await db.execute(
            select(Delivery).where(Delivery.order_id == order.id)
        )
        delivery = delivery.scalar_one_or_none()
        status = order.order_status.value
        reply = f"📦 **Order #{order.id}**\nStatus: {status}\n"
        if delivery:
            reply += f"Delivery: {delivery.delivery_status.replace('_', ' ').title()}\n"
            if delivery.estimated_time:
                reply += f"Estimated: {delivery.estimated_time.strftime('%b %d, %Y at %I:%M %p')}\n"
        reply += f"Total: ₹{order.total_amount:.2f}"
        return reply
    else:
        # show recent orders
        orders = await db.execute(
            select(Order)
            .where(Order.user_id == user.id)
            .order_by(Order.id.desc())
            .limit(3)
        )
        orders = orders.scalars().all()
        if not orders:
            return "You haven't placed any orders yet. Start shopping! 🛒"
        reply = "📋 **Your recent orders:**\n"
        for o in orders:
            reply += f"• Order #{o.id} — {o.order_status.value} (₹{o.total_amount:.2f})\n"
        reply += "Reply with an order number (e.g., #1) to see details."
        return reply

# ---------- Helper: recommend products ----------
async def recommend_products(db, user: User, category: Optional[str] = None, search: Optional[str] = None) -> str:
    query = select(Product).where(Product.is_active == True).order_by(Product.id).limit(5)
    if category:
        # find category by name
        cat = await db.execute(select(Category).where(Category.category_name.ilike(f"%{category}%")))
        cat = cat.scalar_one_or_none()
        if cat:
            query = select(Product).where(Product.category_id == cat.id, Product.is_active == True).limit(5)
    if search:
        query = select(Product).where(Product.name.ilike(f"%{search}%"), Product.is_active == True).limit(5)

    products = (await db.execute(query)).scalars().all()
    if not products:
        return "Sorry, I couldn't find any products matching your request."
    reply = "🛍️ **You might like:**\n"
    for p in products:
        reply += f"• {p.name} — ₹{p.price:.2f}\n"
    return reply

# ---------- Main Chat Endpoint ----------
@router.post("/")
async def chat(
    msg: ChatMessage,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_msg = msg.message.strip().lower()
    reply = ""

    # 1. Check for order ID
    order_id = extract_order_id(msg.message)
    if order_id:
        reply = await get_order_status_reply(db, current_user, order_id)
        return {"reply": reply}

    # 2. Intent detection
    if any(word in user_msg for word in ["order", "my orders", "recent order"]):
        reply = await get_order_status_reply(db, current_user)   # no specific ID
        return {"reply": reply}

    if any(word in user_msg for word in ["track", "delivery", "where is my order", "status"]):
        order_id = extract_order_id(msg.message)
        reply = await get_order_status_reply(db, current_user, order_id)
        return {"reply": reply}

    if any(word in user_msg for word in ["recommend", "suggest", "what do you have", "products", "fruit", "vegetable", "dairy", "meat", "bakery", "beverage", "snack"]):
        # Try to extract category
        categories = ["fruit", "vegetable", "dairy", "meat", "bakery", "beverage", "snack"]
        detected = next((cat for cat in categories if cat in user_msg), None)
        reply = await recommend_products(db, current_user, category=detected)
        return {"reply": reply}

    if any(word in user_msg for word in ["payment", "pay", "refund", "transaction"]):
        reply = "💳 We accept secure payments via credit/debit cards and cash on delivery. For refunds, please contact support."
        return {"reply": reply}

    if any(word in user_msg for word in ["hello", "hi", "hey", "help", "what can you do"]):
        reply = (
            "👋 Hi! I'm your FreshMart assistant. I can help you with:\n"
            "• Checking order status & tracking delivery\n"
            "• Product recommendations\n"
            "• Payment & refund questions\n"
            "Just ask me anything!"
        )
        return {"reply": reply}

    # Fallback – search for product by name
    if len(user_msg.split()) <= 3:
        reply = await recommend_products(db, current_user, search=user_msg)
        return {"reply": reply}

    reply = "I'm sorry, I didn't understand that. Try asking about orders, delivery, or product recommendations."
    return {"reply": reply}