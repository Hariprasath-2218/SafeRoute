"""
Motor async MongoDB client and database accessors.
Indexing uses pymongo synchronously once at startup (required by spec).
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, MongoClient

from app.config import settings

# Global Motor client (async)
motor_client: AsyncIOMotorClient | None = None


def get_motor_client() -> AsyncIOMotorClient:
    if motor_client is None:
        raise RuntimeError("MongoDB client not initialized. Call connect_db first.")
    return motor_client


def get_database() -> AsyncIOMotorDatabase:
    return get_motor_client()[settings.DATABASE_NAME]


async def connect_db() -> None:
    """Create async Motor client."""
    global motor_client
    motor_client = AsyncIOMotorClient(settings.MONGODB_URI)


async def close_db() -> None:
    """Close Motor client on shutdown."""
    global motor_client
    if motor_client is not None:
        motor_client.close()
        motor_client = None


def setup_indexes() -> None:
    """
    Create indexes with pymongo (sync) once at application startup.
    Spec: users.email unique, predictions.user_id, predictions.created_at.
    """
    sync_client = MongoClient(settings.MONGODB_URI)
    db = sync_client[settings.DATABASE_NAME]
    db["users"].create_index([("email", ASCENDING)], unique=True)
    db["predictions"].create_index([("user_id", ASCENDING)])
    db["predictions"].create_index([("created_at", ASCENDING)])
    sync_client.close()
