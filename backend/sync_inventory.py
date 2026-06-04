# sync_inventory.py
import asyncio
from app.database import async_session
from app.models.product import Product
from app.models.inventory import Inventory
from sqlalchemy import select

async def sync():
    async with async_session() as db:
        # Get all products
        result = await db.execute(select(Product))
        products = result.scalars().all()
        for p in products:
            # Check if inventory record exists for this product
            inv_result = await db.execute(select(Inventory).where(Inventory.product_id == p.id))
            if not inv_result.scalar_one_or_none():
                # Create inventory record using current stock_quantity
                db.add(Inventory(product_id=p.id, available_stock=p.stock_quantity))
                print(f"Created inventory for product {p.id} ({p.name}) with stock {p.stock_quantity}")
        await db.commit()
        print("Inventory sync complete!")

asyncio.run(sync())