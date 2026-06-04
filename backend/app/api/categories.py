from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models.category import Category
from ..schemas.category import CategoryCreate, CategoryResponse
from ..core.deps import role_required

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/", response_model=list[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.id))
    return result.scalars().all()

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    # Check if category name already exists
    existing = await db.execute(select(Category).where(Category.category_name == category_in.category_name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Category already exists")
    category = Category(category_name=category_in.category_name)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    # Check for duplicate name (excluding current)
    existing = await db.execute(
        select(Category).where(Category.category_name == category_in.category_name, Category.id != category_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Category name already in use")
    category.category_name = category_in.category_name
    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(category)
    await db.commit()
    return {"message": "Category deleted"}