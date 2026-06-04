import asyncio
from typing import Dict, List

class NotificationPubSub:
    def __init__(self):
        self._subscribers: Dict[int, List[asyncio.Queue]] = {}

    async def subscribe(self, user_id: int) -> asyncio.Queue:
        queue = asyncio.Queue()
        if user_id not in self._subscribers:
            self._subscribers[user_id] = []
        self._subscribers[user_id].append(queue)
        return queue

    async def unsubscribe(self, user_id: int, queue: asyncio.Queue):
        if user_id in self._subscribers:
            try:
                self._subscribers[user_id].remove(queue)
            except ValueError:
                pass
            if not self._subscribers[user_id]:
                del self._subscribers[user_id]

    async def publish(self, user_id: int, message: dict):
        queues = self._subscribers.get(user_id, [])
        for q in queues:
            await q.put(message)

# Global instance
pubsub = NotificationPubSub()