from sqlalchemy.ext.asyncio import AsyncSession
from ..models.notification import Notification
from .notification_pubsub import pubsub
import asyncio

async def create_notification(db: AsyncSession, user_id: int, title: str, message: str, type: str):
    notif = Notification(user_id=user_id, title=title, message=message, type=type)
    db.add(notif)
    await db.flush()   # get ID

    # Fire‑and‑forget publish
    asyncio.create_task(
        pubsub.publish(user_id, {
            "id": notif.id,
            "title": notif.title,
            "message": notif.message,
            "type": notif.type,
            "is_read": notif.is_read,
            "created_at": notif.created_at.isoformat()
        })
    )
    return notif