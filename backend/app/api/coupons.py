from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from ..database import get_db
from ..core.deps import get_current_user, role_required
from ..models.coupon import Coupon, DiscountType
from ..schemas.coupon import CouponCreate, CouponResponse, CouponValidateRequest, CouponValidateResponse

router = APIRouter(prefix="/coupons", tags=["coupons"])

# ---------- Admin: Create Coupon ----------
@router.post("/", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    coupon_in: CouponCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    # Check if code already exists
    existing = await db.execute(select(Coupon).where(Coupon.coupon_code == coupon_in.coupon_code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    coupon = Coupon(**coupon_in.dict())
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    return coupon

# ---------- Admin: List Coupons ----------
@router.get("/", response_model=list[CouponResponse])
async def list_coupons(
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    result = await db.execute(select(Coupon).order_by(Coupon.id.desc()))
    return result.scalars().all()

# ---------- Admin: Delete Coupon ----------
@router.delete("/{coupon_id}")
async def delete_coupon(
    coupon_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    coupon = await db.get(Coupon, coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    await db.delete(coupon)
    await db.commit()
    return {"message": "Coupon deleted"}

# ---------- Customer: Validate Coupon ----------
@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(
    req: CouponValidateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(select(Coupon).where(Coupon.coupon_code == req.coupon_code))
    coupon = result.scalar_one_or_none()

    if not coupon:
        return CouponValidateResponse(valid=False, message="Invalid coupon code")

    # Check active
    if not coupon.is_active:
        return CouponValidateResponse(valid=False, message="Coupon is not active")

    # Check expiry
    if coupon.expiry_date and coupon.expiry_date < datetime.utcnow():
        return CouponValidateResponse(valid=False, message="Coupon has expired")

    # Check usage limit
    if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
        return CouponValidateResponse(valid=False, message="Coupon usage limit reached")

    # Check minimum order amount
    if req.cart_total < coupon.minimum_order_amount:
        return CouponValidateResponse(
            valid=False,
            message=f"Minimum order amount ₹{coupon.minimum_order_amount:.2f} required"
        )

    # Calculate discount
    if coupon.discount_type == DiscountType.PERCENTAGE:
        discount = (req.cart_total * coupon.discount_value) / 100
    else:
        discount = coupon.discount_value

    final_total = max(0, req.cart_total - discount)

    return CouponValidateResponse(
        valid=True,
        message="Coupon applied successfully",
        discount_amount=discount,
        final_total=final_total,
        coupon=CouponResponse.from_orm(coupon)
    )