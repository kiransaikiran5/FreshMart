import os
import uuid
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    UploadFile,
    File,
    Form,
    status,
)
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models.product import Product
from ..models.inventory import Inventory
from ..models.user import User
from ..models.review import Review            # needed for rating filters/sorting
from ..schemas.product import ProductResponse
from ..core.deps import role_required

router = APIRouter(prefix="/products", tags=["Products"])

# ---------------------------------------------------------------
# IMAGE DIRECTORY (must match StaticFiles mount in main.py)
# ---------------------------------------------------------------
IMAGE_DIR = "static/images"
os.makedirs(IMAGE_DIR, exist_ok=True)


def save_image(image: UploadFile) -> str:
    """Save an uploaded image and return ONLY the filename (e.g. 'abc.jpg')."""
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (jpg, png, etc.)",
        )
    ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
    unique_name = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(IMAGE_DIR, unique_name)

    with open(file_path, "wb") as buffer:
        buffer.write(image.file.read())

    return unique_name


def delete_image_file(filename: str):
    """Remove the physical file given just the filename."""
    if not filename:
        return
    file_path = os.path.join(IMAGE_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)


# ---------------------------------------------------------------
# Pydantic model for JSON product update (no image)
# ---------------------------------------------------------------
class ProductUpdate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: int
    price: float
    stock_quantity: int
    brand: Optional[str] = None                # <-- new field
    discount_percent: Optional[float] = 0.0    # <-- new field


# ---------------------------------------------------------------
# LIST PRODUCTS (PUBLIC) – Enhanced with smart filters & sorting
# ---------------------------------------------------------------
@router.get("/", response_model=List[ProductResponse])
async def list_products(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    brand: Optional[str] = Query(None),                  # new
    availability: Optional[bool] = Query(None),          # new (true = in‑stock only)
    discounted: Optional[bool] = Query(None),            # new (true = discounted products)
    min_rating: Optional[float] = Query(None),           # new
    sort_by: Optional[str] = Query(                      # new
        None,
        enum=["price_asc", "price_desc", "name_asc", "name_desc", "rating", "newest", "popular"]
    ),
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).where(Product.is_active == True)

    # Basic filters
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    if category_id:
        query = query.where(Product.category_id == category_id)
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)

    # New filters (assumes Product has 'brand' and 'discount_percent' columns)
    if brand:
        query = query.where(Product.brand.ilike(f"%{brand}%"))
    if availability:
        query = query.where(Product.stock_quantity > 0)
    if discounted:
        query = query.where(Product.discount_percent > 0)

    # Rating filter – only products with average rating >= min_rating
    if min_rating is not None:
        subq = (
            select(Review.product_id)
            .group_by(Review.product_id)
            .having(func.avg(Review.rating) >= min_rating)
        )
        query = query.where(Product.id.in_(subq))

    # Sorting
    if sort_by == 'price_asc':
        query = query.order_by(Product.price.asc())
    elif sort_by == 'price_desc':
        query = query.order_by(Product.price.desc())
    elif sort_by == 'name_asc':
        query = query.order_by(Product.name.asc())
    elif sort_by == 'name_desc':
        query = query.order_by(Product.name.desc())
    elif sort_by == 'newest':
        query = query.order_by(Product.created_at.desc())
    elif sort_by == 'rating':
        # Products without reviews get a rating of 0, sorted descending
        rating_subq = (
            select(Review.product_id, func.avg(Review.rating).label("avg_rating"))
            .group_by(Review.product_id)
            .subquery()
        )
        query = query.outerjoin(rating_subq, Product.id == rating_subq.c.product_id)
        query = query.order_by(func.coalesce(rating_subq.c.avg_rating, 0).desc())
    elif sort_by == 'popular':
        # Most ordered products first – join with order_items
        from ..models.order import OrderItem
        sold_subq = (
            select(OrderItem.product_id, func.sum(OrderItem.quantity).label("total_sold"))
            .group_by(OrderItem.product_id)
            .subquery()
        )
        query = query.outerjoin(sold_subq, Product.id == sold_subq.c.product_id)
        query = query.order_by(func.coalesce(sold_subq.c.total_sold, 0).desc())
    else:
        query = query.order_by(Product.id.desc())   # default order

    result = await db.execute(query)
    products = result.unique().scalars().all()      # unique() avoids duplicates from joins
    return products


# ---------------------------------------------------------------
# CREATE PRODUCT (ADMIN ONLY) – also creates Inventory record
# ---------------------------------------------------------------
@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    description: str = Form(...),
    category_id: int = Form(...),
    price: float = Form(...),
    stock_quantity: int = Form(...),
    image: UploadFile = File(...),
    brand: Optional[str] = Form(None),
    discount_percent: Optional[float] = Form(0.0),
    current_user: User = Depends(role_required("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    image_filename = save_image(image)

    product = Product(
        name=name,
        description=description,
        category_id=category_id,
        price=price,
        stock_quantity=stock_quantity,
        image=image_filename,
        brand=brand,
        discount_percent=discount_percent,
    )
    db.add(product)
    await db.flush()

    inventory = Inventory(
        product_id=product.id,
        available_stock=stock_quantity,
    )
    db.add(inventory)

    await db.commit()
    await db.refresh(product)
    return product


# ---------------------------------------------------------------
# GET SINGLE PRODUCT (PUBLIC)
# ---------------------------------------------------------------
@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.is_active == True)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ---------------------------------------------------------------
# UPDATE PRODUCT (JSON, no image) – ADMIN ONLY
# ---------------------------------------------------------------
@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_in: ProductUpdate,
    current_user: User = Depends(role_required("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.name = product_in.name
    product.description = product_in.description
    product.category_id = product_in.category_id
    product.price = product_in.price
    product.stock_quantity = product_in.stock_quantity
    product.brand = product_in.brand                   # <-- added
    product.discount_percent = product_in.discount_percent   # <-- added

    # Sync inventory
    inv_result = await db.execute(
        select(Inventory).where(Inventory.product_id == product_id)
    )
    inventory = inv_result.scalar_one_or_none()
    if inventory:
        inventory.available_stock = product_in.stock_quantity
    else:
        db.add(Inventory(product_id=product_id, available_stock=product_in.stock_quantity))

    await db.commit()
    await db.refresh(product)
    return product


# ---------------------------------------------------------------
# UPDATE PRODUCT IMAGE (Multipart) – ADMIN ONLY
# ---------------------------------------------------------------
@router.put("/{product_id}/image", response_model=ProductResponse)
async def update_product_image(
    product_id: int,
    image: UploadFile = File(...),
    current_user: User = Depends(role_required("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Delete old image file (if any)
    if product.image:
        delete_image_file(product.image)

    product.image = save_image(image)

    await db.commit()
    await db.refresh(product)
    return product


# ---------------------------------------------------------------
# DELETE PRODUCT (ADMIN ONLY) – soft delete
# ---------------------------------------------------------------
@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    current_user: User = Depends(role_required("ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_active = False
    await db.commit()
    return {"message": "Product deleted successfully"}