"""Log retrieval REST endpoints (stub)."""

from fastapi import APIRouter

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("/fetch")
async def get_fetch_logs() -> list:
    return []


@router.get("/system")
async def get_system_logs() -> list:
    return []
