"""NASA EONET fetcher — natural events (wildfires, storms, volcanoes, floods)."""

import time
from datetime import datetime, timezone

import httpx

from app.fetchers.base import DataFetcher, FetchResult, GeoFeature

EONET_URL = "https://eonet.gsfc.nasa.gov/api/v3/events"
EONET_PARAMS = {"status": "open", "limit": 50}


class EONETFetcher(DataFetcher):
    source_name = "nasa-eonet"
    fetch_interval = 300  # 5 minutes — EONET updates infrequently

    async def fetch(self) -> FetchResult:
        t0 = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.get(EONET_URL, params=EONET_PARAMS)
                resp.raise_for_status()
                raw = resp.json()
            features = await self.transform(raw)
            latency = (time.monotonic() - t0) * 1000
            return FetchResult(
                source=self.source_name,
                record_count=len(features),
                latency_ms=round(latency, 1),
                data=features,
            )
        except Exception as exc:
            latency = (time.monotonic() - t0) * 1000
            return FetchResult(
                source=self.source_name,
                latency_ms=round(latency, 1),
                error=str(exc),
            )

    async def transform(self, raw_data: dict) -> list[GeoFeature]:
        features: list[GeoFeature] = []
        for event in raw_data.get("events", []):
            categories = [c.get("title", "") for c in event.get("categories", [])]
            for geo in event.get("geometry", []):
                coords = geo.get("coordinates")
                if not coords:
                    continue
                # EONET coordinates are [lon, lat] — already GeoJSON order
                geom = {"type": "Point", "coordinates": coords}
                event_time = datetime.fromisoformat(
                    geo.get("date", "").replace("Z", "+00:00")
                ) if geo.get("date") else datetime.now(timezone.utc)
                features.append(
                    GeoFeature(
                        source=self.source_name,
                        title=event.get("title"),
                        geometry=geom,
                        properties={
                            "id": event.get("id"),
                            "categories": categories,
                            "sources": [
                                s.get("url") for s in event.get("sources", [])
                            ],
                        },
                        event_time=event_time,
                    )
                )
        return features
