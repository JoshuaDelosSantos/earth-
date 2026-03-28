"""Abstract base class for all OSINT data fetchers."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class FetchResult:
    source: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    record_count: int = 0
    latency_ms: float = 0.0
    error: str | None = None
    data: Any = None


class DataFetcher(ABC):
    source_name: str
    fetch_interval: int  # seconds

    @abstractmethod
    async def fetch(self) -> FetchResult:
        ...

    @abstractmethod
    async def transform(self, raw_data: Any) -> list[dict]:
        ...
