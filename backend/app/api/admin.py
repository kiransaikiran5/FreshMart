from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..core.deps import role_required
from ..models.order import Order, OrderItem, OrderStatus
from ..models.product import Product
from ..models.user import User, UserRole
from ..schemas.order import OrderResponse, OrderItemResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    """KPI data for the admin dashboard."""
    total_orders = await db.scalar(select(func.count(Order.id)))
    total_revenue = await db.scalar(
        select(func.sum(Order.total_amount))
        .where(Order.order_status.in_([OrderStatus.CONFIRMED, OrderStatus.DELIVERED]))
    )
    products_count = await db.scalar(select(func.count(Product.id)))
    low_stock = await db.scalar(
        select(func.count(Product.id)).where(Product.stock_quantity < 10)
    )
    users_count = await db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.CUSTOMER)
    )

    return {
        "total_orders": total_orders,
        "total_revenue": float(total_revenue or 0),
        "products_count": products_count,
        "low_stock_items": low_stock,
        "users_count": users_count,
    }


@router.get("/top-products")
async def top_products(
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    """Top 10 best-selling products by quantity sold."""
    result = await db.execute(
        select(Product.name, func.sum(OrderItem.quantity).label("total_sold"))
        .join(OrderItem, Product.id == OrderItem.product_id)
        .group_by(Product.id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(10)
    )
    top = result.fetchall()
    return [{"name": row[0], "total_sold": int(row[1])} for row in top]


@router.get("/orders", response_model=list[OrderResponse])
async def admin_get_orders(
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    """Return all orders (for admin monitoring)."""
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user)   # eager load the user relationship
        )
        .order_by(Order.id.desc())
    )
    orders = result.scalars().all()

    response = []
    for order in orders:
        items = []
        for oi in order.items:
            items.append(OrderItemResponse(
                id=oi.id,
                product_id=oi.product_id,
                product_name=oi.product.name if oi.product else "Unknown",
                quantity=oi.quantity,
                price=oi.price,
            ))
        response.append(OrderResponse(
            id=order.id,
            total_amount=order.total_amount,
            order_status=order.order_status,
            created_at=order.created_at,
            items=items,
            user_email=order.user.email if order.user else "N/A",
            user_username=order.user.username if order.user else "N/A",
        ))
    return response