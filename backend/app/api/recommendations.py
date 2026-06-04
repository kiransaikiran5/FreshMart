from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..core.deps import get_current_user
from ..models.order import Order, OrderItem, OrderStatus
from ..models.product import Product
from ..models.category import Category
from ..schemas.product import ProductResponse

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

# Helper to get user's frequently bought category ids
async def get_user_preferred_categories(user_id: int, db: AsyncSession):
    # Find categories of products the user has ordered
    result = await db.execute(
        select(Product.category_id)
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.user_id == user_id, Order.order_status.in_([OrderStatus.CONFIRMED, OrderStatus.DELIVERED]))
        .group_by(Product.category_id)
        .order_by(func.count(Product.category_id).desc())
        .limit(3)
    )
    return [row[0] for row in result.fetchall()]

@router.get("/", response_model=list[ProductResponse])
async def get_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Personalized recommendations:
    - If user has purchase history, recommend products from categories they buy most.
    - Otherwise, recommend popular products (top 10 by number of times ordered).
    """
    # 1. Check user's purchase history
    user_orders_count = await db.scalar(
        select(func.count(Order.id))
        .where(Order.user_id == current_user.id, Order.order_status.in_([OrderStatus.CONFIRMED, OrderStatus.DELIVERED]))
    )

    if user_orders_count and user_orders_count > 0:
        # Get preferred categories
        cat_ids = await get_user_preferred_categories(current_user.id, db)
        if cat_ids:
            result = await db.execute(
                select(Product)
                .where(Product.category_id.in_(cat_ids), Product.is_active == True, Product.stock_quantity > 0)
                .order_by(func.random())  # randomise to keep fresh
                .limit(8)
            )
            return result.scalars().all()

    # Fallback: popular products (most sold)
    popular = await db.execute(
        select(Product)
        .where(Product.is_active == True)
        .order_by(Product.id.desc())   # newest first (could use sales count)
        .limit(8)
    )
    return popular.scalars().all()


@router.get("/frequently-bought-together/{product_id}", response_model=list[ProductResponse])
async def frequently_bought_together(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Products frequently bought together with the given product.
    """
    # Orders that contain this product
    order_ids_subquery = select(OrderItem.order_id).where(OrderItem.product_id == product_id)

    # Other products in those orders
    result = await db.execute(
        select(Product)
        .join(OrderItem, OrderItem.product_id == Product.id)
        .where(
            OrderItem.order_id.in_(order_ids_subquery),
            OrderItem.product_id != product_id,
            Product.is_active == True,
        )
        .group_by(Product.id)
        .order_by(func.count(Product.id).desc())
        .limit(5)
    )
    return result.scalars().all()