"""Pydantic schemas for API request/response models."""

from datetime import datetime
from pydantic import BaseModel


class LayerInfo(BaseModel):
    id: str
    name: str
    source: str
    status: str  # idle | loading | ok | error
    last_update: datetime | None = None
    record_count: int = 0
    fetch_interval: int = 0


class LogEntrySchema(BaseModel):
    timestamp: str
    source: str
    level: str  # INFO | WARN | ERR
    message: str


class PaginatedLogs(BaseModel):
    items: list[LogEntrySchema]
    total: int
    offset: int
    limit: int
