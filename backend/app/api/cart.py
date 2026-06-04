# app/api/cart.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..core.deps import get_current_user
from ..models.cart import Cart, CartItem
from ..models.product import Product
from ..schemas.cart import CartAdd, CartResponse, CartItemResponse
from ..models.user import User

router = APIRouter(prefix="/cart", tags=["cart"])


async def get_or_create_cart(db: AsyncSession, user: User) -> Cart:
    """Return the user's cart, creating it if necessary (committed immediately)."""
    result = await db.execute(
        select(Cart).where(Cart.user_id == user.id)
    )
    cart = result.scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=user.id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)
    return cart


@router.get("/", response_model=CartResponse)
async def get_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch the user's cart with all items and product details (eager loaded)."""
    cart = await get_or_create_cart(db, current_user)

    # Eagerly load cart items and their associated products
    result = await db.execute(
        select(Cart)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
        .where(Cart.id == cart.id)
    )
    cart = result.scalar_one()

    # Build response
    items = []
    total = 0.0
    for ci in cart.items:
        item_total = ci.quantity * ci.product.price
        total += item_total
        items.append(
            CartItemResponse(
                id=ci.id,
                product_id=ci.product_id,
                product_name=ci.product.name,
                price=ci.product.price,
                quantity=ci.quantity,
                image=ci.product.image,   # This must exist on the Product model
            )
        )

    return CartResponse(id=cart.id, items=items, total=total)


@router.post("/add", status_code=status.HTTP_200_OK)
async def add_to_cart(
    item: CartAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a product to the user's cart, or increase quantity if already present."""
    cart = await get_or_create_cart(db, current_user)

    # Validate product
    product = await db.get(Product, item.product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found or unavailable")
    if product.stock_quantity < item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    # Check if product already in cart
    existing_item = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == item.product_id,
        )
    )
    cart_item = existing_item.scalar_one_or_none()

    if cart_item:
        new_qty = cart_item.quantity + item.quantity
        if new_qty > product.stock_quantity:
            raise HTTPException(status_code=400, detail="Requested quantity exceeds available stock")
        cart_item.quantity = new_qty
    else:
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=item.product_id,
            quantity=item.quantity,
        )
        db.add(cart_item)

    await db.commit()
    return {"message": "Added to cart"}


@router.put("/items/{item_id}", status_code=status.HTTP_200_OK)
async def update_cart_item(
    item_id: int,
    quantity: int = Query(..., gt=0, description="New quantity (must be > 0)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update quantity of a cart item."""
    cart_item = await db.get(CartItem, item_id)
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    # Ownership check
    cart = await db.get(Cart, cart_item.cart_id)
    if cart.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only modify your own cart")

    # Validate stock
    product = await db.get(Product, cart_item.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if quantity > product.stock_quantity:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds available stock")

    cart_item.quantity = quantity
    await db.commit()
    return {"message": "Cart updated"}


@router.delete("/items/{item_id}", status_code=status.HTTP_200_OK)
async def remove_cart_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove an item from the user's cart."""
    cart_item = await db.get(CartItem, item_id)
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    # Ownership check
    cart = await db.get(Cart, cart_item.cart_id)
    if cart.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only modify your own cart")

    await db.delete(cart_item)
    await db.commit()
    return {"message": "Item removed"}