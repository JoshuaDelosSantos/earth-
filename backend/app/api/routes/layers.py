"""Data layer REST endpoints (stub)."""

from fastapi import APIRouter

router = APIRouter(prefix="/layers", tags=["layers"])


@router.get("")
async def list_layers() -> list:
    return []


@router.get("/{layer_id}/data")
async def get_layer_data(layer_id: str) -> dict:
    return {"type": "FeatureCollection", "features": []}
