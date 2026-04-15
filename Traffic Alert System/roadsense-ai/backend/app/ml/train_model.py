"""
Full training pipeline: load CSV, encode categoricals, scale features,
compare RandomForest vs XGBoost, persist best model and artifacts.
Run: python -m app.ml.train_model  (from backend/) or python app/ml/train_model.py with PYTHONPATH.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import joblib
import matplotlib

matplotlib.use("Agg")  # headless chart export
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from xgboost import XGBClassifier

# Project paths
ML_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ML_DIR.parent.parent

CATEGORICAL_COLS = [
    "day_of_week",
    "city",
    "state",
    "road_type",
    "road_surface_condition",
    "weather_condition",
    "light_condition",
    "vehicle_type_involved",
]

DROP_COLS = ["record_id", "date", "time", "accident_type"]

FEATURE_NAMES = [
    "hour_of_day",
    "month",
    "city_enc",
    "state_enc",
    "road_type_enc",
    "road_surface_enc",
    "road_width_meters",
    "number_of_lanes",
    "speed_limit_kmh",
    "average_speed_kmh",
    "weather_enc",
    "temperature_celsius",
    "humidity_percent",
    "visibility_km",
    "traffic_density",
    "light_enc",
    "signal_present",
    "road_divider_present",
    "vehicle_type_enc",
    "vehicles_involved",
    "pedestrians_nearby",
    "risk_score",
]

TARGET = "accident_occurred"


def load_and_engineer(csv_path: Path | str) -> tuple[pd.DataFrame, pd.Series, dict[str, LabelEncoder], dict[str, float]]:
    """Load dataset, drop unused columns, label-encode categoricals, return X, y, encoders, medians."""
    df = pd.read_csv(csv_path)
    for c in DROP_COLS:
        if c in df.columns:
            df = df.drop(columns=[c])

    encoders: dict[str, LabelEncoder] = {}
    for col in CATEGORICAL_COLS:
        le = LabelEncoder()
        df[col] = df[col].astype(str).fillna("unknown")
        enc_col = f"{col}_enc"
        df[enc_col] = le.fit_transform(df[col])
        encoders[col] = le

    # Align encoded column names with the 22 model features (spec); drop day_of_week encoding (not used).
    df = df.rename(
        columns={
            "road_surface_condition_enc": "road_surface_enc",
            "weather_condition_enc": "weather_enc",
            "light_condition_enc": "light_enc",
            "vehicle_type_involved_enc": "vehicle_type_enc",
        }
    )
    if "day_of_week_enc" in df.columns:
        df = df.drop(columns=["day_of_week_enc"])

    X = df[FEATURE_NAMES].copy()
    y = df[TARGET].astype(int)

    medians = {col: float(X[col].median()) for col in FEATURE_NAMES}
    X = X.fillna(medians)

    return X, y, encoders, medians


def train_models(X: pd.DataFrame, y: pd.Series) -> tuple[Any, StandardScaler, str, dict[str, float]]:
    """
    Train RandomForest and XGBoost; pick higher test accuracy.
    Returns best_estimator, scaler, model_kind ('rf'|'xgb'), metrics.
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X.values, y.values, test_size=0.2, random_state=42, stratify=y.values
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train_s, y_train)
    rf_pred = rf.predict(X_test_s)
    rf_acc = accuracy_score(y_test, rf_pred)

    xgb = XGBClassifier(
        n_estimators=200,
        max_depth=15,
        learning_rate=0.1,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,
    )
    xgb.fit(X_train_s, y_train)
    xgb_pred = xgb.predict(X_test_s)
    xgb_acc = accuracy_score(y_test, xgb_pred)

    if xgb_acc >= rf_acc:
        best = xgb
        kind = "xgb"
        pred = xgb_pred
        name = "XGBoost"
    else:
        best = rf
        kind = "rf"
        pred = rf_pred
        name = "RandomForest"

    metrics = {
        "accuracy": float(accuracy_score(y_test, pred)),
        "precision": float(precision_score(y_test, pred, zero_division=0)),
        "recall": float(recall_score(y_test, pred, zero_division=0)),
        "f1": float(f1_score(y_test, pred, zero_division=0)),
        "model_name": name,
    }

    print(f"\n=== Selected model: {name} (RF acc={rf_acc:.4f}, XGB acc={xgb_acc:.4f}) ===")
    print(f"Accuracy:  {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"F1:        {metrics['f1']:.4f}")
    print("Confusion matrix:\n", confusion_matrix(y_test, pred))

    # Feature importance chart (top 15)
    importances = best.feature_importances_
    idx = np.argsort(importances)[::-1][:15]
    plt.figure(figsize=(10, 6))
    plt.barh(range(len(idx)), importances[idx][::-1])
    plt.yticks(range(len(idx)), [FEATURE_NAMES[i] for i in idx][::-1])
    plt.xlabel("Importance")
    plt.title(f"{name} — Top feature importances")
    plt.tight_layout()
    chart_path = ML_DIR / "feature_importance.png"
    plt.savefig(chart_path)
    plt.close()
    print(f"Feature importance chart saved to {chart_path}")

    return best, scaler, kind, metrics


def save_artifacts(
    model: Any,
    scaler: StandardScaler,
    encoders: dict[str, LabelEncoder],
    medians: dict[str, float],
    metrics: dict[str, float],
    model_kind: str,
) -> None:
    """Persist model, scaler, encoders, feature order, and metadata JSON."""
    joblib.dump(model, ML_DIR / "model.pkl")
    joblib.dump(scaler, ML_DIR / "scaler.pkl")
    joblib.dump(encoders, ML_DIR / "label_encoders.pkl")
    joblib.dump(FEATURE_NAMES, ML_DIR / "feature_names.pkl")

    meta = {
        "metrics": metrics,
        "model_kind": model_kind,
        "feature_names": FEATURE_NAMES,
        "imputation_medians": medians,
        "categorical_columns": CATEGORICAL_COLS,
    }
    with open(ML_DIR / "model_meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)


def train_from_csv(csv_path: str | Path) -> dict[str, Any]:
    """Entry point used by CLI and FastAPI /ml/train."""
    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")

    X, y, encoders, medians = load_and_engineer(path)
    model, scaler, model_kind, metrics = train_models(X, y)
    save_artifacts(model, scaler, encoders, medians, metrics, model_kind)
    from datetime import datetime

    with open(ML_DIR / "model_meta.json", "r", encoding="utf-8") as f:
        meta = json.load(f)
    meta["trained_at"] = datetime.utcnow().isoformat() + "Z"
    with open(ML_DIR / "model_meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    return meta


def main() -> None:
    """CLI: default dataset next to repo root (Traffic Alert System folder)."""
    # roadsense-ai/backend -> repo root's parent often contains the shared CSV
    repo_parent = BACKEND_DIR.parent.parent  # e.g. .../Traffic Alert System
    default_csv = repo_parent / "Indian_Traffic_Accident_Dataset.csv"
    win_alt = Path(r"M:\Traffic Alert System\Indian_Traffic_Accident_Dataset.csv")
    if not default_csv.exists() and win_alt.exists():
        default_csv = win_alt
    csv_arg = sys.argv[1] if len(sys.argv) > 1 else str(default_csv)
    train_from_csv(csv_arg)


if __name__ == "__main__":
    main()
