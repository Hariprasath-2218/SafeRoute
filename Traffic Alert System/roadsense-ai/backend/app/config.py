"""
Application configuration loaded from environment variables with sensible defaults.
Secrets should be overridden via .env in production; never commit production credentials.
"""
import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Load .env from backend directory
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)


class Settings:
    """Centralized settings for JWT, MongoDB, and CORS."""

    # MongoDB — prefer MONGODB_URI in environment
    MONGODB_URI: str = os.getenv(
        "MONGODB_URI",
        "mongodb+srv://ailearner2218:hari%402005@cluster0.9qe9z.mongodb.net/",
    )
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "roadsense_db")

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "roadsense-super-secret-key-2024")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # CORS — comma-separated explicit origins
    CORS_ORIGINS: list[str] = [
        x.strip()
        for x in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:5174",
        ).split(",")
        if x.strip()
    ]
    # Matches any localhost / 127.0.0.1 port (Vite, etc.). Set CORS_ORIGIN_REGEX= to disable.
    CORS_ORIGIN_REGEX: str | None = os.getenv(
        "CORS_ORIGIN_REGEX",
        r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    ) or None

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    ML_DIR: Path = BASE_DIR / "app" / "ml"
    UPLOADS_DIR: Path = BASE_DIR / "uploads"

    # Default Indian traffic dataset path (training)
    DEFAULT_DATASET_PATH: str = os.getenv(
        "DEFAULT_DATASET_PATH",
        r"M:\Traffic Alert System\Indian_Traffic_Accident_Dataset.csv",
    )

    # Local LLM (Ollama)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
    OLLAMA_SYSTEM_PROMPT: str = os.getenv(
        "OLLAMA_SYSTEM_PROMPT",
        "traffic assistant",
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()


settings = get_settings()
