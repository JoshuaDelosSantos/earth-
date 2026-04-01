"""OpenSky Network fetcher — live global aircraft positions."""

import time
from datetime import datetime, timezone

import httpx

from app.fetchers.base import DataFetcher, FetchResult, GeoFeature

# OpenSky REST API — anonymous (no key), rate-limited to ~10 req/min
OPENSKY_URL = "https://opensky-network.org/api/states/all"


class OpenSkyFetcher(DataFetcher):
    source_name = "opensky-aircraft"
    fetch_interval = 30  # seconds — respectful polling

    async def fetch(self) -> FetchResult:
        t0 = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(OPENSKY_URL)
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
        states = raw_data.get("states") or []
        ts = raw_data.get("time", 0)
        event_time = datetime.fromtimestamp(ts, tz=timezone.utc) if ts else datetime.now(timezone.utc)

        for s in states:
            # OpenSky state vector indices:
            # 0=icao24, 1=callsign, 2=origin_country, 5=longitude, 6=latitude,
            # 7=baro_altitude, 9=velocity, 10=true_track, 13=geo_altitude
            lon = s[5]
            lat = s[6]
            if lon is None or lat is None:
                continue
            features.append(
                GeoFeature(
                    source=self.source_name,
                    title=(s[1] or "").strip() or s[0],
                    geometry={"type": "Point", "coordinates": [lon, lat]},
                    properties={
                        "icao24": s[0],
                        "callsign": (s[1] or "").strip(),
                        "origin_country": s[2],
                        "altitude": s[7] or s[13],
                        "velocity": s[9],
                        "heading": s[10],
                        "on_ground": s[8],
                    },
                    event_time=event_time,
                )
            )
        return features
