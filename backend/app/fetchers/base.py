"""Abstract base class for all OSINT data fetchers."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class GeoFeature:
    """A normalised GeoJSON-style feature for storage and transmission."""

    source: str
    title: str | None
    geometry: dict  # GeoJSON geometry object
    properties: dict
    magnitude: float | None = None
    event_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class FetchResult:
    source: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    record_count: int = 0
    latency_ms: float = 0.0
    error: str | None = None
    data: list[GeoFeature] = field(default_factory=list)


class DataFetcher(ABC):
    source_name: str
    fetch_interval: int  # seconds

    @abstractmethod
    async def fetch(self) -> FetchResult:
        """Fetch raw data from the source and return a FetchResult."""
        ...

    @abstractmethod
    async def transform(self, raw_data: Any) -> list[GeoFeature]:
        """Transform raw API response data into a list of GeoFeatures."""
        ...
