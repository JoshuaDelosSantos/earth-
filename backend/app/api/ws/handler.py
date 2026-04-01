"""WebSocket endpoint for real-time data push to frontend clients."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.api.ws.manager import manager

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; ignore client messages for now
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
