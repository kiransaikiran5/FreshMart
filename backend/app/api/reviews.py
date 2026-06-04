from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..database import get_db
from ..core.deps import get_current_user
from ..models.review import Review
from ..models.user import User
from ..schemas.review import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_in: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Check duplicate
    existing = await db.execute(
        select(Review).where(
            Review.user_id == current_user.id,
            Review.product_id == review_in.product_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already reviewed this product")

    review = Review(
        user_id=current_user.id,
        product_id=review_in.product_id,
        rating=review_in.rating,
        review_text=review_in.review_text,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    # Get username for response
    user = await db.get(User, current_user.id)

    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        username=user.username if user else "unknown",
        product_id=review.product_id,
        rating=review.rating,
        review_text=review.review_text,
        created_at=review.created_at,
    )

@router.get("/product/{product_id}", response_model=list[ReviewResponse])
async def get_product_reviews(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review).where(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    response = []
    for r in reviews:
        user = await db.get(User, r.user_id)
        response.append(ReviewResponse(
            id=r.id,
            user_id=r.user_id,
            username=user.username if user else "unknown",
            product_id=r.product_id,
            rating=r.rating,
            review_text=r.review_text,
            created_at=r.created_at,
        ))
    return response

@router.get("/product/{product_id}/average")
async def get_average_rating(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(func.avg(Review.rating)).where(Review.product_id == product_id)
    )
    avg = result.scalar()
    return {"average_rating": round(float(avg), 1) if avg else 0}