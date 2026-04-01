"""Background scheduler — runs OSINT fetchers on configured intervals."""

import asyncio
import json
import logging
from datetime import datetime, timezone

from redis.asyncio import Redis

from app.fetchers.base import DataFetcher, FetchResult, GeoFeature
from app.services.store import store_features, features_to_geojson

logger = logging.getLogger("earth.scheduler")

# Registry of all fetcher instances
FETCHER_REGISTRY: list[DataFetcher] = []


def register_fetchers() -> None:
    """Instantiate and register all known fetchers."""
    from app.fetchers.usgs import USGSFetcher
    from app.fetchers.eonet import EONETFetcher
    from app.fetchers.gdelt import GDELTFetcher
    from app.fetchers.opensky import OpenSkyFetcher

    FETCHER_REGISTRY.clear()
    FETCHER_REGISTRY.extend([
        USGSFetcher(),
        EONETFetcher(),
        GDELTFetcher(),
        OpenSkyFetcher(),
    ])


async def run_fetch_cycle(fetcher: DataFetcher, redis: Redis) -> None:
    """Execute a single fetch-transform-store-publish cycle."""
    result: FetchResult = await fetcher.fetch()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    # Build log entry
    if result.error:
        log_entry = {
            "type": "fetch_log",
            "timestamp": now,
            "source": result.source,
            "level": "ERR",
            "message": f"fetch failed: {result.error} ({result.latency_ms:.0f}ms)",
        }
        logger.warning("Fetch error [%s]: %s", result.source, result.error)
    else:
        log_entry = {
            "type": "fetch_log",
            "timestamp": now,
            "source": result.source,
            "level": "INFO",
            "message": (
                f"fetched {result.record_count} records "
                f"({result.latency_ms:.0f}ms)"
            ),
        }
        logger.info(
            "Fetched %d records from %s in %.0fms",
            result.record_count, result.source, result.latency_ms,
        )

    # Publish fetch log to Redis for WebSocket broadcast
    await redis.publish("earth:logs", json.dumps(log_entry))

    # Store features and publish data update
    if result.data:
        await store_features(result.source, result.data)

        geojson = features_to_geojson(result.data)
        data_msg = {
            "type": "data_update",
            "layer_id": result.source,
            "timestamp": now,
            "record_count": result.record_count,
            "geojson": geojson,
        }
        await redis.publish("earth:data", json.dumps(data_msg))


async def fetcher_loop(fetcher: DataFetcher, redis: Redis) -> None:
    """Infinite loop that runs a fetcher on its configured interval."""
    while True:
        try:
            await run_fetch_cycle(fetcher, redis)
        except Exception as exc:
            logger.exception("Unhandled error in fetcher loop [%s]: %s", fetcher.source_name, exc)
        await asyncio.sleep(fetcher.fetch_interval)


async def start_scheduler(redis: Redis) -> list[asyncio.Task]:
    """Start all fetcher loops as background tasks. Returns task handles."""
    register_fetchers()
    tasks = []
    for fetcher in FETCHER_REGISTRY:
        task = asyncio.create_task(
            fetcher_loop(fetcher, redis),
            name=f"fetcher:{fetcher.source_name}",
        )
        tasks.append(task)
        logger.info(
            "Started fetcher: %s (interval=%ds)",
            fetcher.source_name, fetcher.fetch_interval,
        )
    return tasks
