"""Pydantic schemas for prediction and history APIs."""
from typing import Any, Literal

from pydantic import BaseModel, Field


class Location(BaseModel):
    lat: float
    lng: float
    name: str = ""


class RoadWeatherBase(BaseModel):
    """Shared road, weather, and traffic fields for point and route prediction."""

    hour_of_day: int = Field(..., ge=0, le=23)
    month: int | None = Field(default=None, ge=1, le=12)
    city: str = Field(..., min_length=1)
    state: str = Field(..., min_length=1)
    road_type: str = Field(..., min_length=1)
    road_surface_condition: str = Field(..., min_length=1)
    road_width_meters: float = Field(..., ge=0)
    number_of_lanes: int = Field(..., ge=1)
    speed_limit_kmh: float = Field(..., ge=0)
    average_speed_kmh: float = Field(..., ge=0)
    weather_condition: str = Field(..., min_length=1)
    temperature_celsius: float
    humidity_percent: float = Field(..., ge=0, le=100)
    visibility_km: float = Field(..., ge=0)
    traffic_density: float = Field(..., ge=0, le=1)
    light_condition: str = Field(..., min_length=1)
    signal_present: int = Field(..., ge=0, le=1)
    road_divider_present: int = Field(..., ge=0, le=1)
    vehicle_type_involved: str = Field(..., min_length=1)
    vehicles_involved: int = Field(..., ge=0)
    pedestrians_nearby: int = Field(..., ge=0)
    risk_score: float | None = Field(default=None, ge=0, le=100)


class PointPredictRequest(RoadWeatherBase):
    latitude: float
    longitude: float


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class PointPredictResponse(BaseModel):
    risk_score: float
    severity_level: str
    accident_occurred: int
    prediction_id: str
    probability: float
    feature_importance_top5: list[FeatureImportanceItem]


class RoutePredictRequest(RoadWeatherBase):
    source: Location
    destination: Location
    travel_time: str = "12:00"


class WaypointRisk(BaseModel):
    lat: float
    lng: float
    risk: float
    severity: str


class RoutePredictResponse(BaseModel):
    overall_risk: float
    waypoints: list[WaypointRisk]
    safest_hour: int
    route_distance_km: float
    prediction_id: str


class HistoryItem(BaseModel):
    id: str
    prediction_type: Literal["point", "route"]
    risk_score: float
    severity_level: str
    city: str
    weather_condition: str
    created_at: str
    latitude: float | None = None
    longitude: float | None = None


class HistoryListResponse(BaseModel):
    items: list[HistoryItem]
    total: int
    page: int
    limit: int


class HistoryDetailResponse(BaseModel):
    id: str
    prediction_type: str
    input_features: dict[str, Any]
    risk_score: float
    severity_level: str
    accident_occurred_prediction: int
    source_location: dict[str, Any] | None
    destination_location: dict[str, Any] | None
    waypoint_risks: list[dict[str, Any]] | None
    city: str
    created_at: str


class HistoryStatsResponse(BaseModel):
    total_predictions: int
    alerts_count: int
    safe_routes_count: int
    by_severity: dict[str, int]
    by_city: dict[str, int]
