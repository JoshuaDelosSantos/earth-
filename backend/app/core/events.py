"""Application lifecycle hooks for startup and shutdown."""

from fastapi import FastAPI
from redis.asyncio import from_url as redis_from_url

from app.config import settings
from app.core.db import engine


async def on_startup(app: FastAPI) -> None:
    app.state.redis = redis_from_url(settings.redis_url, decode_responses=True)


async def on_shutdown(app: FastAPI) -> None:
    await app.state.redis.aclose()
    await engine.dispose()
