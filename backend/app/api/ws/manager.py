"""WebSocket connection manager for broadcasting messages."""

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.active.remove(websocket)

    async def broadcast(self, message: dict) -> None:
        for connection in self.active:
            await connection.send_json(message)


manager = ConnectionManager()
