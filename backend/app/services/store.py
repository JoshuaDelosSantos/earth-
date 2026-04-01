"""Data storage service — stores GeoFeatures to DB and provides GeoJSON conversion."""

import logging
from datetime import datetime, timezone

from app.core.db import async_session
from app.fetchers.base import GeoFeature

logger = logging.getLogger("earth.store")

# In-memory cache of latest data per source (for fast REST responses)
_layer_cache: dict[str, dict] = {}
_layer_meta: dict[str, dict] = {}


def features_to_geojson(features: list[GeoFeature]) -> dict:
    """Convert a list of GeoFeatures to a GeoJSON FeatureCollection."""
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": f.geometry,
                "properties": {
                    "source": f.source,
                    "title": f.title,
                    "magnitude": f.magnitude,
                    "event_time": f.event_time.isoformat(),
                    **f.properties,
                },
            }
            for f in features
        ],
    }


async def store_features(source: str, features: list[GeoFeature]) -> None:
    """Store features to PostGIS database and update in-memory cache."""
    now = datetime.now(timezone.utc)

    # Update in-memory cache immediately
    geojson = features_to_geojson(features)
    _layer_cache[source] = geojson
    _layer_meta[source] = {
        "status": "ok",
        "last_update": now.isoformat(),
        "record_count": len(features),
    }

    # Store to DB
    try:
        from geoalchemy2.shape import from_shape
        from shapely.geometry import shape
        from shapely import force_2d

        from app.models.geo_data import GeoDataPoint

        async with async_session() as session:
            for f in features:
                geom_shape = force_2d(shape(f.geometry))
                geom = from_shape(geom_shape, srid=4326)
                point = GeoDataPoint(
                    source=source,
                    title=f.title,
                    geometry=geom,
                    properties=f.properties,
                    magnitude=f.magnitude,
                    event_time=f.event_time,
                    fetched_at=now,
                )
                session.add(point)
            await session.commit()
    except Exception as exc:
        logger.warning("DB store failed for %s: %s", source, exc)


def get_cached_geojson(source: str) -> dict | None:
    """Return the latest cached GeoJSON for a source."""
    return _layer_cache.get(source)


def get_layer_meta(source: str) -> dict | None:
    """Return cached metadata for a source."""
    return _layer_meta.get(source)


def get_all_layer_meta() -> dict[str, dict]:
    """Return metadata for all sources."""
    return dict(_layer_meta)
