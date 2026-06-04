from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..core.deps import role_required
from ..models.inventory import Inventory
from ..models.product import Product
from ..schemas.inventory import InventoryResponse, InventoryAlertResponse

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/", response_model=list[InventoryResponse])
async def list_inventory(
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    """Get current inventory levels for all **active** products."""
    result = await db.execute(
        select(Inventory)
        .options(selectinload(Inventory.product))
        .join(Product, Inventory.product_id == Product.id)
        .where(Product.is_active == True)
    )
    inventories = result.scalars().all()
    return [
        InventoryResponse(
            id=inv.id,
            product_id=inv.product_id,
            product_name=inv.product.name if inv.product else "N/A",
            available_stock=inv.available_stock,
            updated_at=inv.updated_at,
        )
        for inv in inventories
    ]


@router.get("/{product_id}", response_model=InventoryResponse)
async def get_inventory(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    """Get inventory for a single active product."""
    result = await db.execute(
        select(Inventory)
        .options(selectinload(Inventory.product))
        .join(Product, Inventory.product_id == Product.id)
        .where(Inventory.product_id == product_id, Product.is_active == True)
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found or product is inactive")
    return InventoryResponse(
        id=inv.id,
        product_id=inv.product_id,
        product_name=inv.product.name if inv.product else "N/A",
        available_stock=inv.available_stock,
        updated_at=inv.updated_at,
    )


@router.get("/alerts/low-stock", response_model=list[InventoryAlertResponse])
async def low_stock_alerts(
    threshold: int = Query(10, description="Stock quantity below this value triggers an alert"),
    db: AsyncSession = Depends(get_db),
    admin=Depends(role_required("ADMIN"))
):
    """Get active products with stock below a given threshold."""
    result = await db.execute(
        select(Inventory)
        .options(selectinload(Inventory.product))
        .join(Product, Inventory.product_id == Product.id)
        .where(Inventory.available_stock < threshold, Product.is_active == True)
    )
    inventories = result.scalars().all()
    alerts = []
    for inv in inventories:
        alerts.append(InventoryAlertResponse(
            product_id=inv.product_id,
            product_name=inv.product.name if inv.product else "N/A",
            available_stock=inv.available_stock,
            threshold=threshold,
            message=f"Low stock: only {inv.available_stock} left.",
        ))
    return alerts