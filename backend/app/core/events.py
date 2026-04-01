"""Application lifecycle hooks for startup and shutdown."""

import asyncio
import json
import logging
from datetime import datetime, timezone

from fastapi import FastAPI
from redis.asyncio import from_url as redis_from_url

from app.config import settings
from app.core.db import engine

logger = logging.getLogger("earth.lifecycle")


async def on_startup(app: FastAPI) -> None:
    redis = redis_from_url(settings.redis_url, decode_responses=True)
    app.state.redis = redis

    # Publish system boot log
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    await redis.publish(
        "earth:system",
        json.dumps({
            "type": "system_log",
            "timestamp": now,
            "source": "SYS",
            "level": "INFO",
            "message": "backend started",
        }),
    )

    # Start WebSocket Redis listener
    from app.api.ws.manager import manager
    await manager.start_redis_listener(redis)

    # Start background fetcher scheduler
    from app.services.scheduler import start_scheduler
    tasks = await start_scheduler(redis)
    app.state.fetcher_tasks = tasks

    logger.info("earth- backend started (%d fetcher tasks)", len(tasks))


async def on_shutdown(app: FastAPI) -> None:
    # Cancel fetcher tasks
    for task in getattr(app.state, "fetcher_tasks", []):
        task.cancel()
    cancelled = getattr(app.state, "fetcher_tasks", [])
    if cancelled:
        await asyncio.gather(*cancelled, return_exceptions=True)

    # Stop WS Redis listener
    from app.api.ws.manager import manager
    await manager.stop()

    # Close Redis and DB
    await app.state.redis.aclose()
    await engine.dispose()
    logger.info("earth- backend stopped")
