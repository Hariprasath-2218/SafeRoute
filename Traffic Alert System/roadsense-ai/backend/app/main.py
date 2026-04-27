"""
RoadSense AI — FastAPI entrypoint: MongoDB (Motor), JWT auth, ML inference, CORS.
"""
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import close_db, connect_db, setup_indexes
from app.routers import assistant, auth, history, ml, prediction
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.ml_service import model_ready

@asynccontextmanager
async def lifespan(_: FastAPI):
    """Connect MongoDB, ensure indexes, disconnect on shutdown."""
    db_ready = True
    try:
        await connect_db()
        setup_indexes()
    except Exception:  # noqa: BLE001
        db_ready = False
    _.state.db_ready = db_ready
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


@app.get("/")
async def root() -> dict:
    """Basic route index for browser checks and mobile debugging."""
    return {
        "status": "ok",
        "routes": {
            "health": "/health",
            "login": "/auth/login",
            "login_alias": "/login",
            "register": "/auth/register",
            "me": "/auth/me",
            "history": "/history",
        },
    }


@app.post("/login", response_model=TokenResponse, include_in_schema=False)
async def login_alias(body: LoginRequest, response: Response) -> TokenResponse:
    """Compatibility alias for direct testing from browser or tools."""
    return await auth._login_user(body, response)


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
        "server": "running",
        "model": "ready" if model_ready() else "missing",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
