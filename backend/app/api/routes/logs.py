"""Log retrieval REST endpoints — paginated fetch and system logs."""

from fastapi import APIRouter, Query

from app.schemas import PaginatedLogs
from app.services.log_buffer import get_fetch_logs, get_system_logs

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("/fetch", response_model=PaginatedLogs)
async def fetch_logs(
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> PaginatedLogs:
    items, total = get_fetch_logs(offset, limit)
    return PaginatedLogs(items=items, total=total, offset=offset, limit=limit)


@router.get("/system", response_model=PaginatedLogs)
async def system_logs(
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> PaginatedLogs:
    items, total = get_system_logs(offset, limit)
    return PaginatedLogs(items=items, total=total, offset=offset, limit=limit)
