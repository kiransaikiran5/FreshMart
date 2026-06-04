from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime

from ..database import get_db
from ..core.deps import role_required
from ..models.campaign import Campaign
from ..models.coupon import Coupon
from ..models.order import Order, OrderStatus
from ..schemas.campaign import CampaignCreate, CampaignResponse, CampaignPerformance

router = APIRouter(prefix="/admin/campaigns", tags=["campaigns"])

# ---------- List all campaigns ----------
@router.get("/", response_model=list[CampaignResponse])
async def list_campaigns(
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    result = await db.execute(select(Campaign).order_by(Campaign.created_at.desc()))
    return result.scalars().all()

# ---------- Create a campaign ----------
@router.post("/", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    campaign_in: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    campaign = Campaign(**campaign_in.dict())
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign

# ---------- Update a campaign ----------
@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: int,
    campaign_in: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    for field, value in campaign_in.dict().items():
        setattr(campaign, field, value)
    await db.commit()
    await db.refresh(campaign)
    return campaign

# ---------- Delete a campaign ----------
@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await db.delete(campaign)
    await db.commit()
    return {"message": "Campaign deleted"}

# ---------- Campaign performance ----------
@router.get("/{campaign_id}/performance", response_model=CampaignPerformance)
async def get_campaign_performance(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Orders that used a coupon belonging to this campaign
    # Join orders with coupons where coupon.campaign_id == campaign_id
    result = await db.execute(
        select(
            func.count(Order.id).label("total_orders"),
            func.sum(Order.discount_amount).label("total_discount"),
            func.sum(Order.total_amount).label("total_revenue")
        )
        .join(Coupon, Order.coupon_id == Coupon.id)
        .where(Coupon.campaign_id == campaign_id, Order.order_status.in_([OrderStatus.CONFIRMED, OrderStatus.DELIVERED]))
    )
    stats = result.one()

    coupon_count = await db.scalar(
        select(func.count(Coupon.id)).where(Coupon.campaign_id == campaign_id)
    )

    return CampaignPerformance(
        campaign_id=campaign_id,
        campaign_name=campaign.name,
        total_orders=stats.total_orders or 0,
        total_discount=float(stats.total_discount or 0),
        total_revenue=float(stats.total_revenue or 0),
        coupon_usage_count=coupon_count or 0
    )

# ---------- Top campaigns (by revenue) ----------
@router.get("/top", response_model=list[CampaignPerformance])
async def top_campaigns(
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    result = await db.execute(
        select(
            Campaign.id.label("campaign_id"),
            Campaign.name.label("campaign_name"),
            func.count(Order.id).label("total_orders"),
            func.sum(Order.discount_amount).label("total_discount"),
            func.sum(Order.total_amount).label("total_revenue")
        )
        .join(Coupon, Campaign.id == Coupon.campaign_id, isouter=True)
        .join(Order, Coupon.id == Order.coupon_id, isouter=True)
        .where(Order.order_status.in_([OrderStatus.CONFIRMED, OrderStatus.DELIVERED]) | (Order.id == None))
        .group_by(Campaign.id)
        .order_by(func.sum(Order.total_amount).desc())
        .limit(5)
    )
    rows = result.fetchall()
    performances = []
    for row in rows:
        coupon_count = await db.scalar(
            select(func.count(Coupon.id)).where(Coupon.campaign_id == row.campaign_id)
        )
        performances.append(CampaignPerformance(
            campaign_id=row.campaign_id,
            campaign_name=row.campaign_name,
            total_orders=row.total_orders or 0,
            total_discount=float(row.total_discount or 0),
            total_revenue=float(row.total_revenue or 0),
            coupon_usage_count=coupon_count or 0
        ))
    return performances