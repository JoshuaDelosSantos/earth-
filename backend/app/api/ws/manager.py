"""WebSocket connection manager with Redis pub/sub fan-out."""

import asyncio
import json
import logging

from fastapi import WebSocket
from redis.asyncio import Redis

from app.services.log_buffer import add_fetch_log, add_system_log

logger = logging.getLogger("earth.ws")


class ConnectionManager:
    def __init__(self) -> None:
        self.active: list[WebSocket] = []
        self._redis_task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.append(websocket)
        logger.info("WS client connected (%d active)", len(self.active))

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active:
            self.active.remove(websocket)
        logger.info("WS client disconnected (%d active)", len(self.active))

    async def broadcast(self, message: dict) -> None:
        """Send a JSON message to all connected clients."""
        dead: list[WebSocket] = []
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    async def start_redis_listener(self, redis: Redis) -> None:
        """Subscribe to Redis channels and fan-out messages to WebSocket clients."""
        self._redis_task = asyncio.create_task(
            self._redis_loop(redis), name="ws:redis-listener"
        )

    async def _redis_loop(self, redis: Redis) -> None:
        """Listen on Redis pub/sub channels and broadcast to WS clients."""
        pubsub = redis.pubsub()
        await pubsub.subscribe("earth:data", "earth:logs", "earth:system")
        logger.info("Redis pub/sub listener started")
        try:
            async for msg in pubsub.listen():
                if msg["type"] != "message":
                    continue
                try:
                    data = json.loads(msg["data"])
                except (json.JSONDecodeError, TypeError):
                    continue

                # Route to log buffer for REST endpoints
                msg_type = data.get("type")
                if msg_type == "fetch_log":
                    add_fetch_log(data)
                elif msg_type == "system_log":
                    add_system_log(data)

                await self.broadcast(data)
        except asyncio.CancelledError:
            await pubsub.unsubscribe()
            await pubsub.close()

    async def stop(self) -> None:
        if self._redis_task and not self._redis_task.done():
            self._redis_task.cancel()
            try:
                await self._redis_task
            except asyncio.CancelledError:
                pass


manager = ConnectionManager()
