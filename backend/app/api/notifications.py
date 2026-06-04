from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sse_starlette.sse import EventSourceResponse
import json
import asyncio

from ..database import get_db
from ..core.deps import get_current_user
from ..core.security import decode_token
from ..models.notification import Notification
from ..models.user import User
from ..schemas.notification import NotificationResponse
from ..services.notification_pubsub import pubsub

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Helper to authenticate SSE connection using a query parameter
async def get_current_user_sse(
    token: str = Query(..., description="JWT access token"),
    db: AsyncSession = Depends(get_db),
):
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401)
    user = await db.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ----- Normal REST endpoints -----
@router.get("/", response_model=list[NotificationResponse])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    return result.scalars().all()

@router.put("/{notif_id}/read")
async def mark_read(
    notif_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    notif = await db.get(Notification, notif_id)
    if not notif or notif.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    return {"message": "Marked as read"}

# ----- Real‑time SSE stream -----
@router.get("/stream")
async def stream_notifications(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_sse),
):
    async def event_generator():
        queue = await pubsub.subscribe(current_user.id)
        try:
            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield {
                        "event": "new_notification",
                        "data": json.dumps(message, default=str)
                    }
                except asyncio.TimeoutError:
                    yield {"comment": "keepalive"}
                if await request.is_disconnected():
                    break
        finally:
            await pubsub.unsubscribe(current_user.id, queue)

    return EventSourceResponse(event_generator())