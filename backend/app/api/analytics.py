from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract, case, and_
from datetime import datetime, timedelta
from typing import Optional

from ..database import get_db
from ..core.deps import role_required
from ..models.order import Order, OrderStatus, OrderItem
from ..models.product import Product
from ..models.user import User, UserRole
from ..models.inventory import Inventory
from ..models.review import Review

router = APIRouter(prefix="/admin/analytics", tags=["analytics"])


# ---------- Daily Sales Report ----------
@router.get("/daily-sales")
async def daily_sales(
    days: int = Query(7, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    """Sales summary grouped by day for the last `days` days."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(
            func.date(Order.created_at).label("date"),
            func.count(Order.id).label("total_orders"),
            func.sum(Order.total_amount).label("revenue")
        )
        .where(Order.created_at >= cutoff, Order.order_status.in_([OrderStatus.CONFIRMED, OrderStatus.DELIVERED]))
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    rows = result.fetchall()
    return [
        {"date": row.date.strftime("%Y-%m-%d"), "total_orders": row.total_orders, "revenue": float(row.revenue or 0)}
        for row in rows
    ]


# ---------- Monthly Revenue Report ----------
@router.get("/monthly-revenue")
async def monthly_revenue(
    year: int = Query(None, description="Year, defaults to current year"),
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    """Revenue grouped by month for a given year."""
    if not year:
        year = datetime.utcnow().year
    result = await db.execute(
        select(
            extract('month', Order.created_at).label("month"),
            func.sum(Order.total_amount).label("revenue")
        )
        .where(
            extract('year', Order.created_at) == year,
            Order.order_status.in_([OrderStatus.CONFIRMED, OrderStatus.DELIVERED])
        )
        .group_by(extract('month', Order.created_at))
        .order_by(extract('month', Order.created_at))
    )
    rows = result.fetchall()
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return [
        {"month": months[int(row.month)-1], "month_num": int(row.month), "revenue": float(row.revenue or 0)}
        for row in rows
    ]


# ---------- Top Selling Products (enhanced) ----------
@router.get("/top-products")
async def top_products(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    """Top products by quantity sold, with revenue contribution."""
    result = await db.execute(
        select(
            Product.name,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.quantity * OrderItem.price).label("total_revenue")
        )
        .join(OrderItem, Product.id == OrderItem.product_id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.order_status.in_([OrderStatus.CONFIRMED, OrderStatus.DELIVERED]))
        .group_by(Product.id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
    )
    rows = result.fetchall()
    return [
        {"name": row.name, "total_sold": int(row.total_sold), "total_revenue": float(row.total_revenue)}
        for row in rows
    ]


# ---------- Customer Purchase Trends ----------
@router.get("/customer-trends")
async def customer_trends(
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    """New vs returning customers and average order frequency."""
    # New customers in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_customers = await db.scalar(
        select(func.count(User.id))
        .where(User.role == UserRole.CUSTOMER, User.created_at >= thirty_days_ago)
    )
    total_customers = await db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.CUSTOMER)
    )
    # Average orders per customer (only those who placed at least one order)
    orders_count = await db.scalar(
        select(func.count(Order.id)).where(Order.order_status.in_([OrderStatus.CONFIRMED, OrderStatus.DELIVERED]))
    )
    customers_with_orders = await db.scalar(
        select(func.count(func.distinct(Order.user_id)))
        .where(Order.order_status.in_([OrderStatus.CONFIRMED, OrderStatus.DELIVERED]))
    )
    avg_orders_per_customer = round(orders_count / customers_with_orders, 2) if customers_with_orders else 0

    # Repeat purchase rate: customers with >1 order
    repeat_customers = await db.scalar(
        select(func.count(func.distinct(Order.user_id)))
        .where(Order.order_status.in_([OrderStatus.CONFIRMED, OrderStatus.DELIVERED]))
        .group_by(Order.user_id)
        .having(func.count(Order.id) > 1)
    )
    repeat_rate = round((repeat_customers / total_customers) * 100, 1) if total_customers else 0

    return {
        "new_customers_last_30_days": new_customers or 0,
        "total_customers": total_customers or 0,
        "avg_orders_per_customer": avg_orders_per_customer,
        "repeat_purchase_rate": repeat_rate
    }


# ---------- Inventory Movement Report ----------
@router.get("/inventory-movement")
async def inventory_movement(
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    """Products with highest movement (sold) and low stock alerts."""
    # Top 5 most sold products (movement)
    result = await db.execute(
        select(
            Product.name,
            func.sum(OrderItem.quantity).label("total_sold"),
            Product.stock_quantity.label("current_stock")
        )
        .join(OrderItem, Product.id == OrderItem.product_id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.order_status.in_([OrderStatus.CONFIRMED, OrderStatus.DELIVERED]))
        .group_by(Product.id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
    )
    movement = [
        {"name": row.name, "total_sold": int(row.total_sold), "current_stock": row.current_stock}
        for row in result.fetchall()
    ]

    # Low stock items (stock < 10)
    low_stock_result = await db.execute(
        select(Product.name, Product.stock_quantity)
        .where(Product.stock_quantity < 10, Product.is_active == True)
        .order_by(Product.stock_quantity)
        .limit(5)
    )
    low_stock = [
        {"name": row.name, "stock": row.stock_quantity}
        for row in low_stock_result.fetchall()
    ]

    return {
        "top_movement": movement,
        "low_stock": low_stock
    }