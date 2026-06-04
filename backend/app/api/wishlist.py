from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..core.deps import get_current_user
from ..models.wishlist import Wishlist
from ..models.product import Product
from ..models.cart import Cart, CartItem
from ..schemas.wishlist import WishlistItemCreate, WishlistItemResponse

router = APIRouter(prefix="/wishlist", tags=["wishlist"])

# ---------- Get user's wishlist ----------
@router.get("/", response_model=list[WishlistItemResponse])
async def get_wishlist(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(
        select(Wishlist)
        .options(selectinload(Wishlist.product))
        .where(Wishlist.user_id == current_user.id)
        .order_by(Wishlist.created_at.desc())
    )
    items = result.scalars().all()
    response = []
    for item in items:
        product = item.product
        response.append(WishlistItemResponse(
            id=item.id,
            user_id=item.user_id,
            product_id=item.product_id,
            product_name=product.name if product else "N/A",
            product_price=product.price if product else 0,
            product_image=product.image if product else None,
            stock_quantity=product.stock_quantity if product else 0,
            created_at=item.created_at,
        ))
    return response

# ---------- Add product to wishlist ----------
@router.post("/add", status_code=status.HTTP_201_CREATED)
async def add_to_wishlist(
    item: WishlistItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Check product exists and is active
    product = await db.get(Product, item.product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found or inactive")

    # Check already in wishlist
    existing = await db.execute(
        select(Wishlist).where(
            Wishlist.user_id == current_user.id,
            Wishlist.product_id == item.product_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Product already in wishlist")

    wishlist_item = Wishlist(user_id=current_user.id, product_id=item.product_id)
    db.add(wishlist_item)
    await db.commit()
    return {"message": "Added to wishlist"}

# ---------- Remove product from wishlist ----------
@router.delete("/{product_id}")
async def remove_from_wishlist(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(
        select(Wishlist).where(
            Wishlist.user_id == current_user.id,
            Wishlist.product_id == product_id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not in wishlist")
    await db.delete(item)
    await db.commit()
    return {"message": "Removed from wishlist"}

# ---------- Move wishlist item to cart ----------
@router.post("/move-to-cart/{product_id}")
async def move_to_cart(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Check wishlist entry
    wishlist_result = await db.execute(
        select(Wishlist).where(
            Wishlist.user_id == current_user.id,
            Wishlist.product_id == product_id
        )
    )
    wishlist_item = wishlist_result.scalar_one_or_none()
    if not wishlist_item:
        raise HTTPException(status_code=404, detail="Product not in wishlist")

    # Check product availability
    product = await db.get(Product, product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=400, detail="Product unavailable")
    if product.stock_quantity < 1:
        raise HTTPException(status_code=400, detail="Product out of stock")

    # Get or create cart
    cart_result = await db.execute(select(Cart).where(Cart.user_id == current_user.id))
    cart = cart_result.scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        await db.flush()

    # Check if already in cart
    cart_item_result = await db.execute(
        select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product_id)
    )
    cart_item = cart_item_result.scalar_one_or_none()
    if cart_item:
        cart_item.quantity += 1
        if cart_item.quantity > product.stock_quantity:
            raise HTTPException(status_code=400, detail="Exceeds available stock")
    else:
        db.add(CartItem(cart_id=cart.id, product_id=product_id, quantity=1))

    # Remove from wishlist
    await db.delete(wishlist_item)

    await db.commit()
    return {"message": "Moved to cart"}