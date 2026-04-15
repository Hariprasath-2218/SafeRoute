"""
RoadSense AI — FastAPI entrypoint: MongoDB (Motor), JWT auth, ML inference, CORS.
"""
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import close_db, connect_db, setup_indexes
from app.routers import assistant, auth, history, ml, prediction
from app.services.ml_service import model_ready

@asynccontextmanager
async def lifespan(_: FastAPI):
    """Connect MongoDB, ensure indexes, disconnect on shutdown."""
    await connect_db()
    setup_indexes()
    yield
    await close_db()


app = FastAPI(
    title="RoadSense AI API",
    description="Real-Time Traffic Accident Prediction Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(prediction.router)
app.include_router(history.router)
app.include_router(ml.router)
app.include_router(assistant.router)


@app.get("/health")
async def health() -> dict:
    """Liveness: database ping and model file presence."""
    from app.database import get_motor_client

    db_ok = False
    try:
        client = get_motor_client()
        await client.admin.command("ping")
        db_ok = True
    except Exception:  # noqa: BLE001
        db_ok = False

    return {
        "status": "ok" if db_ok else "degraded",
        "db": "up" if db_ok else "down",
        "model": "ready" if model_ready() else "missing",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
