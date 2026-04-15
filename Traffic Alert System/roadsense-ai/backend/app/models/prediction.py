"""
MongoDB prediction document helpers for the `predictions` collection.
"""
from datetime import datetime
from typing import Any, Literal


def prediction_doc(
    user_id: Any,
    prediction_type: Literal["point", "route"],
    input_features: dict[str, Any],
    risk_score: float,
    severity_level: str,
    accident_occurred_prediction: int,
    city: str,
    source_location: dict[str, Any] | None = None,
    destination_location: dict[str, Any] | None = None,
    waypoint_risks: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Assemble prediction document for MongoDB insert."""
    doc: dict[str, Any] = {
        "user_id": user_id,
        "prediction_type": prediction_type,
        "input_features": input_features,
        "risk_score": float(risk_score),
        "severity_level": severity_level,
        "accident_occurred_prediction": int(accident_occurred_prediction),
        "city": city,
        "created_at": datetime.utcnow(),
    }
    if source_location is not None:
        doc["source_location"] = source_location
    if destination_location is not None:
        doc["destination_location"] = destination_location
    if waypoint_risks is not None:
        doc["waypoint_risks"] = waypoint_risks
    return doc
