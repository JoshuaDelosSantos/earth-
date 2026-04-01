"""Data layer REST endpoints — list layers, get cached data."""

from fastapi import APIRouter

from app.schemas import LayerInfo
from app.services.store import get_cached_geojson, get_all_layer_meta

router = APIRouter(prefix="/layers", tags=["layers"])

# Static layer definitions (mirrors frontend DEFAULT_LAYERS)
LAYER_DEFS: dict[str, dict] = {
    "usgs-earthquake": {"name": "USGS Earthquakes", "source": "USGS", "fetch_interval": 60},
    "nasa-eonet": {"name": "NASA EONET Events", "source": "NASA", "fetch_interval": 300},
    "gdelt-news": {"name": "GDELT News Events", "source": "GDELT", "fetch_interval": 900},
    "opensky-aircraft": {"name": "OpenSky Aircraft", "source": "OpenSky", "fetch_interval": 30},
    "nasa-gibs": {"name": "NASA GIBS Imagery", "source": "NASA GIBS", "fetch_interval": 0},
}


@router.get("", response_model=list[LayerInfo])
async def list_layers() -> list[LayerInfo]:
    meta = get_all_layer_meta()
    layers = []
    for layer_id, defn in LAYER_DEFS.items():
        m = meta.get(layer_id, {})
        layers.append(
            LayerInfo(
                id=layer_id,
                name=defn["name"],
                source=defn["source"],
                status=m.get("status", "idle"),
                last_update=m.get("last_update"),
                record_count=m.get("record_count", 0),
                fetch_interval=defn["fetch_interval"],
            )
        )
    return layers


@router.get("/{layer_id}/data")
async def get_layer_data(layer_id: str) -> dict:
    cached = get_cached_geojson(layer_id)
    if cached:
        return cached
    return {"type": "FeatureCollection", "features": []}
