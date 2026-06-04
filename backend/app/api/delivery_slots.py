from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..core.deps import role_required
from ..models.delivery_slot import DeliverySlot
from ..schemas.delivery_slot import DeliverySlotCreate, DeliverySlotResponse

router = APIRouter(prefix="/delivery-slots", tags=["delivery-slots"])

# ---------- Public: list available slots ----------
@router.get("/", response_model=list[DeliverySlotResponse])
async def get_slots(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DeliverySlot).where(DeliverySlot.available_capacity > 0).order_by(DeliverySlot.start_time)
    )
    return result.scalars().all()

# ---------- Admin: create a slot ----------
@router.post("/", response_model=DeliverySlotResponse, status_code=status.HTTP_201_CREATED)
async def create_slot(
    slot_in: DeliverySlotCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN")),
):
    slot = DeliverySlot(**slot_in.dict())
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    return slot

# ---------- Admin: delete a slot ----------
@router.delete("/{slot_id}")
async def delete_slot(
    slot_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN")),
):
    slot = await db.get(DeliverySlot, slot_id)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    await db.delete(slot)
    await db.commit()
    return {"message": "Slot deleted"}