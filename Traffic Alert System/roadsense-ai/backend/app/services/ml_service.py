"""
Server-side ML inference: load joblib artifacts, encode features, predict.
All inference stays on the server (never expose model files to the client).
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.preprocessing import LabelEncoder

from app.ml.train_model import CATEGORICAL_COLS, FEATURE_NAMES

ML_DIR = Path(__file__).resolve().parent.parent / "ml"


def _safe_encode(le: LabelEncoder, value: str) -> int:
    """Map value to integer; unknown labels map to 0 to avoid crashes."""
    value = str(value).strip() if value is not None else "unknown"
    if value in le.classes_:
        return int(le.transform([value])[0])
    return 0


def severity_from_probability(p_accident: float) -> str:
    """Map accident probability to enterprise severity buckets."""
    if p_accident < 0.25:
        return "Low"
    if p_accident < 0.5:
        return "Medium"
    if p_accident < 0.75:
        return "High"
    return "Critical"


@lru_cache(maxsize=1)
def _load_bundle() -> tuple[Any, Any, dict[str, LabelEncoder], list[str], dict[str, Any]]:
    """Load model, scaler, encoders, feature names, and metadata (cached)."""
    model_path = ML_DIR / "model.pkl"
    scaler_path = ML_DIR / "scaler.pkl"
    encoders_path = ML_DIR / "label_encoders.pkl"
    features_path = ML_DIR / "feature_names.pkl"
    meta_path = ML_DIR / "model_meta.json"

    if not model_path.exists():
        raise FileNotFoundError(
            "Model not trained yet. Run: python -m app.ml.train_model from the backend folder."
        )

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    encoders: dict[str, LabelEncoder] = joblib.load(encoders_path)
    feature_names: list[str] = joblib.load(features_path)
    meta: dict[str, Any] = {}
    if meta_path.exists():
        with open(meta_path, encoding="utf-8") as f:
            meta = json.load(f)
    return model, scaler, encoders, feature_names, meta


def reload_artifacts() -> None:
    """Clear cache after retraining."""
    _load_bundle.cache_clear()


def model_ready() -> bool:
    return (ML_DIR / "model.pkl").exists()


def get_model_info() -> dict[str, Any]:
    """Expose training metrics and timestamp for GET /ml/model-info."""
    meta_path = ML_DIR / "model_meta.json"
    if not meta_path.exists():
        return {"trained": False, "message": "No model_meta.json"}
    with open(meta_path, encoding="utf-8") as f:
        return json.load(f)


def build_feature_vector(
    row: dict[str, Any],
    encoders: dict[str, LabelEncoder],
    medians: dict[str, float],
) -> np.ndarray:
    """
    Build 1 x n_features vector from API payload dict.
    row keys match human-readable names; internal columns use *_enc names.
    """
    month = int(row.get("month") or 1)
    hour = int(row["hour_of_day"])
    city = row["city"]
    state = row["state"]
    road_type = row["road_type"]
    road_surface = row["road_surface_condition"]
    weather = row["weather_condition"]
    light = row["light_condition"]
    vehicle_type = row["vehicle_type_involved"]

    city_enc = _safe_encode(encoders["city"], city)
    state_enc = _safe_encode(encoders["state"], state)
    road_type_enc = _safe_encode(encoders["road_type"], road_type)
    road_surface_enc = _safe_encode(encoders["road_surface_condition"], road_surface)
    weather_enc = _safe_encode(encoders["weather_condition"], weather)
    light_enc = _safe_encode(encoders["light_condition"], light)
    vehicle_type_enc = _safe_encode(encoders["vehicle_type_involved"], vehicle_type)

    risk = row.get("risk_score")
    if risk is None:
        risk = float(medians.get("risk_score", 35.0))
    else:
        risk = float(risk)

    values = [
        float(hour),
        float(month),
        float(city_enc),
        float(state_enc),
        float(road_type_enc),
        float(road_surface_enc),
        float(row["road_width_meters"]),
        float(row["number_of_lanes"]),
        float(row["speed_limit_kmh"]),
        float(row["average_speed_kmh"]),
        float(weather_enc),
        float(row["temperature_celsius"]),
        float(row["humidity_percent"]),
        float(row["visibility_km"]),
        float(row["traffic_density"]),
        float(light_enc),
        float(row["signal_present"]),
        float(row["road_divider_present"]),
        float(vehicle_type_enc),
        float(row["vehicles_involved"]),
        float(row["pedestrians_nearby"]),
        float(risk),
    ]
    return np.array(values, dtype=np.float64).reshape(1, -1)


def top_feature_importance(model: Any, names: list[str], k: int = 5) -> list[dict[str, float]]:
    """Return top-k features by importance for tree models."""
    if not hasattr(model, "feature_importances_"):
        return []
    imp = model.feature_importances_
    order = np.argsort(imp)[::-1][:k]
    return [{"feature": names[i], "importance": float(imp[i])} for i in order]


def predict_point_features(row: dict[str, Any]) -> dict[str, Any]:
    """
    Run binary classifier; return risk score (0-100), severity, class, probability,
    and top feature importances.
    """
    model, scaler, encoders, feature_names, meta = _load_bundle()
    medians = meta.get("imputation_medians", {})
    X = build_feature_vector(row, encoders, medians)
    Xs = scaler.transform(X)
    proba = model.predict_proba(Xs)[0]
    p_accident = float(proba[1] if len(proba) > 1 else proba[0])
    pred_class = int(model.predict(Xs)[0])
    risk_score = round(p_accident * 100, 2)
    severity = severity_from_probability(p_accident)
    names = feature_names if feature_names else FEATURE_NAMES
    importance = top_feature_importance(model, names, 5)
    return {
        "risk_score": risk_score,
        "severity_level": severity,
        "accident_occurred": pred_class,
        "probability": p_accident,
        "feature_importance_top5": importance,
    }
