"""USGS Earthquake fetcher — real-time global earthquake events from GeoJSON feeds."""

import time

import httpx

from app.fetchers.base import DataFetcher, FetchResult, GeoFeature

# USGS GeoJSON feed — all earthquakes in the past hour
USGS_FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson"


class USGSFetcher(DataFetcher):
    source_name = "usgs-earthquake"
    fetch_interval = 60  # seconds

    async def fetch(self) -> FetchResult:
        t0 = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(USGS_FEED_URL)
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
            props = f.get("properties", {})
            geom = f.get("geometry")
            if not geom:
                continue
            from datetime import datetime, timezone

            event_time = datetime.fromtimestamp(
                props.get("time", 0) / 1000, tz=timezone.utc
            )
            features.append(
                GeoFeature(
                    source=self.source_name,
                    title=props.get("title") or props.get("place"),
                    geometry=geom,
                    properties={
                        "mag": props.get("mag"),
                        "place": props.get("place"),
                        "url": props.get("url"),
                        "type": props.get("type"),
                        "alert": props.get("alert"),
                    },
                    magnitude=props.get("mag"),
                    event_time=event_time,
                )
            )
        return features
