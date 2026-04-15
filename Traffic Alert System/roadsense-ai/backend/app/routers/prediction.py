"""Prediction endpoints: single point and multi-waypoint route risk."""
from datetime import datetime
import math

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_current_user
from app.database import get_database
from app.models.prediction import prediction_doc
from app.schemas.prediction import (
    FeatureImportanceItem,
    PointPredictRequest,
    PointPredictResponse,
    RoutePredictRequest,
    RoutePredictResponse,
    WaypointRisk,
)
from app.services.ml_service import get_model_info, model_ready, predict_point_features

router = APIRouter(prefix="/predict", tags=["predict"])


def _row_from_point(body: PointPredictRequest) -> dict:
    """Normalize month default and build dict for ML service."""
    month = body.month if body.month is not None else datetime.utcnow().month
    return {
        "hour_of_day": body.hour_of_day,
        "month": month,
        "city": body.city,
        "state": body.state,
        "road_type": body.road_type,
        "road_surface_condition": body.road_surface_condition,
        "road_width_meters": body.road_width_meters,
        "number_of_lanes": body.number_of_lanes,
        "speed_limit_kmh": body.speed_limit_kmh,
        "average_speed_kmh": body.average_speed_kmh,
        "weather_condition": body.weather_condition,
        "temperature_celsius": body.temperature_celsius,
        "humidity_percent": body.humidity_percent,
        "visibility_km": body.visibility_km,
        "traffic_density": body.traffic_density,
        "light_condition": body.light_condition,
        "signal_present": body.signal_present,
        "road_divider_present": body.road_divider_present,
        "vehicle_type_involved": body.vehicle_type_involved,
        "vehicles_involved": body.vehicles_involved,
        "pedestrians_nearby": body.pedestrians_nearby,
        "risk_score": body.risk_score,
    }


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two WGS84 points in kilometers."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(min(1.0, a)))


def interpolate_waypoints(src_lat: float, src_lng: float, dst_lat: float, dst_lng: float, n: int = 8):
    """Linear interpolation for n waypoints strictly between source and destination."""
    pts = []
    for i in range(1, n + 1):
        t = i / (n + 1)
        lat = src_lat + t * (dst_lat - src_lat)
        lng = src_lng + t * (dst_lng - src_lng)
        pts.append((lat, lng))
    return pts


@router.post("/point", response_model=PointPredictResponse)
async def predict_point(
    body: PointPredictRequest,
    current: dict = Depends(get_current_user),
) -> PointPredictResponse:
    """Classify accident risk for a single geospatial context and persist history."""
    if not model_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model not available. Train the model first.",
        )
    row = _row_from_point(body)
    out = predict_point_features(row)
    db = get_database()

    input_features = row | {"latitude": body.latitude, "longitude": body.longitude}
    doc = prediction_doc(
        user_id=current["_id"],
        prediction_type="point",
        input_features=input_features,
        risk_score=out["risk_score"],
        severity_level=out["severity_level"],
        accident_occurred_prediction=out["accident_occurred"],
        city=body.city,
        source_location={"lat": body.latitude, "lng": body.longitude, "name": body.city},
    )
    res = await db["predictions"].insert_one(doc)
    await db["users"].update_one(
        {"_id": current["_id"]},
        {"$inc": {"total_predictions": 1}},
    )

    top5 = [FeatureImportanceItem(**x) for x in out["feature_importance_top5"]]
    return PointPredictResponse(
        risk_score=out["risk_score"],
        severity_level=out["severity_level"],
        accident_occurred=out["accident_occurred"],
        prediction_id=str(res.inserted_id),
        probability=out["probability"],
        feature_importance_top5=top5,
    )


@router.post("/route", response_model=RoutePredictResponse)
async def predict_route(
    body: RoutePredictRequest,
    current: dict = Depends(get_current_user),
) -> RoutePredictResponse:
    """
    Sample 8 waypoints between source and destination, score each with the ML model,
    and aggregate overall route risk (mean of waypoint scores).
    """
    if not model_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model not available. Train the model first.",
        )

    month = body.month if body.month is not None else datetime.utcnow().month
    base = {
        "hour_of_day": body.hour_of_day,
        "month": month,
        "city": body.city,
        "state": body.state,
        "road_type": body.road_type,
        "road_surface_condition": body.road_surface_condition,
        "road_width_meters": body.road_width_meters,
        "number_of_lanes": body.number_of_lanes,
        "speed_limit_kmh": body.speed_limit_kmh,
        "average_speed_kmh": body.average_speed_kmh,
        "weather_condition": body.weather_condition,
        "temperature_celsius": body.temperature_celsius,
        "humidity_percent": body.humidity_percent,
        "visibility_km": body.visibility_km,
        "traffic_density": body.traffic_density,
        "light_condition": body.light_condition,
        "signal_present": body.signal_present,
        "road_divider_present": body.road_divider_present,
        "vehicle_type_involved": body.vehicle_type_involved,
        "vehicles_involved": body.vehicles_involved,
        "pedestrians_nearby": body.pedestrians_nearby,
        "risk_score": body.risk_score,
    }

    meta = get_model_info()
    medians = meta.get("imputation_medians", {})
    base_risk = float(base["risk_score"] if base["risk_score"] is not None else medians.get("risk_score", 35.0))

    waypoints_out: list[WaypointRisk] = []
    pts = interpolate_waypoints(
        body.source.lat,
        body.source.lng,
        body.destination.lat,
        body.destination.lng,
        8,
    )

    for idx, (lat, lng) in enumerate(pts):
        # Slight deterministic variation per segment so polylines show gradient diversity.
        row = dict(base)
        row["risk_score"] = min(100.0, max(0.0, base_risk + (idx - 3.5) * 2.5))
        row["traffic_density"] = min(1.0, max(0.0, float(body.traffic_density) + idx * 0.02))
        out = predict_point_features(row)
        waypoints_out.append(
            WaypointRisk(lat=lat, lng=lng, risk=out["risk_score"], severity=out["severity_level"])
        )

    overall = round(sum(w.risk for w in waypoints_out) / len(waypoints_out), 2)

    # Safest hour: cheapest brute-force search using same base row shape.
    best_h = body.hour_of_day
    best_p = 1.0
    for h in range(24):
        hrow = dict(base)
        hrow["hour_of_day"] = h
        hrow["risk_score"] = base_risk
        po = predict_point_features(hrow)
        if po["probability"] < best_p:
            best_p = po["probability"]
            best_h = h

    dist_km = haversine_km(
        body.source.lat,
        body.source.lng,
        body.destination.lat,
        body.destination.lng,
    )

    input_features = dict(base) | {
        "travel_time": body.travel_time,
        "source": body.source.model_dump(),
        "destination": body.destination.model_dump(),
    }
    waypoint_payload = [w.model_dump() for w in waypoints_out]
    sev = "Medium"
    if overall < 30:
        sev = "Low"
    elif overall >= 70:
        sev = "Critical"
    elif overall >= 50:
        sev = "High"

    doc = prediction_doc(
        user_id=current["_id"],
        prediction_type="route",
        input_features=input_features,
        risk_score=overall,
        severity_level=sev,
        accident_occurred_prediction=1 if overall >= 55 else 0,
        city=body.city,
        source_location=body.source.model_dump(),
        destination_location=body.destination.model_dump(),
        waypoint_risks=waypoint_payload,
    )
    db = get_database()
    res = await db["predictions"].insert_one(doc)
    await db["users"].update_one(
        {"_id": current["_id"]},
        {"$inc": {"total_predictions": 1}},
    )

    return RoutePredictResponse(
        overall_risk=overall,
        waypoints=waypoints_out,
        safest_hour=best_h,
        route_distance_km=round(dist_km, 2),
        prediction_id=str(res.inserted_id),
    )
