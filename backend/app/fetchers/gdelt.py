"""GDELT fetcher — geolocated global news events from the GDELT GEO API."""

import time
from datetime import datetime, timezone

import httpx

from app.fetchers.base import DataFetcher, FetchResult, GeoFeature

# GDELT GEO 2.0 API — returns geolocated events
GDELT_GEO_URL = "https://api.gdeltproject.org/api/v2/geo/geo"
GDELT_PARAMS = {
    "query": "conflict",
    "format": "GeoJSON",
    "geores": "3",
}


class GDELTFetcher(DataFetcher):
    source_name = "gdelt-news"
    fetch_interval = 900  # 15 minutes — matches GDELT update cadence

    async def fetch(self) -> FetchResult:
        t0 = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.get(GDELT_GEO_URL, params=GDELT_PARAMS)
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
        for f in raw_data.get("features", []):
            geom = f.get("geometry")
            props = f.get("properties", {})
            if not geom:
                continue
            features.append(
                GeoFeature(
                    source=self.source_name,
                    title=props.get("name") or props.get("html"),
                    geometry=geom,
                    properties={
                        "url": props.get("url"),
                        "name": props.get("name"),
                        "shareimage": props.get("shareimage"),
                        "count": props.get("count"),
                    },
                    event_time=datetime.now(timezone.utc),
                )
            )
        return features
