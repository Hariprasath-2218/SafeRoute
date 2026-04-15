"""ML dataset upload, training trigger, and model metadata endpoints."""
import shutil
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.config import settings
from app.ml.train_model import train_from_csv
from app.services import ml_service

router = APIRouter(prefix="/ml", tags=["ml"])

# Ensure upload directory exists
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)) -> dict:
    """Accept a CSV upload and store it under backend/uploads for training."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="CSV file required")
    dest = settings.UPLOADS_DIR / "uploaded_dataset.csv"
    with dest.open("wb") as buf:
        shutil.copyfileobj(file.file, buf)
    return {"path": str(dest), "filename": file.filename}


@router.post("/train")
async def train(
    file: UploadFile | None = File(default=None),
    uploaded_only: bool = False,
) -> dict:
    """
    Retrain from multipart CSV when provided; otherwise use uploads or DEFAULT_DATASET_PATH.
    """
    csv_path: str
    if file and file.filename:
        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="CSV file required")
        dest = settings.UPLOADS_DIR / "train_upload.csv"
        with dest.open("wb") as buf:
            shutil.copyfileobj(file.file, buf)
        csv_path = str(dest)
    else:
        path = settings.UPLOADS_DIR / "uploaded_dataset.csv" if uploaded_only else None
        csv_path = str(path) if path and path.exists() else settings.DEFAULT_DATASET_PATH
    if not Path(csv_path).exists():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No CSV found at {csv_path}. Upload via /ml/upload-dataset first.",
        )
    meta = train_from_csv(csv_path)
    ml_service.reload_artifacts()
    return {"status": "ok", "meta": meta}


@router.get("/model-info")
async def model_info() -> dict:
    """Return persisted training metrics and artifact presence."""
    return ml_service.get_model_info()
