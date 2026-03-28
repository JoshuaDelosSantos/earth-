"""FastAPI application entry point for the earth- backend."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.events import on_startup, on_shutdown
from app.api.routes.health import router as health_router
from app.api.routes.layers import router as layers_router
from app.api.routes.logs import router as logs_router
from app.api.ws.handler import router as ws_router


@asynccontextmanager
async def lifespan(application: FastAPI):
    await on_startup(application)
    yield
    await on_shutdown(application)


app = FastAPI(
    title="earth-",
    description="Backend API for the earth- OSINT dashboard",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(layers_router, prefix="/api")
app.include_router(logs_router, prefix="/api")
app.include_router(ws_router)
