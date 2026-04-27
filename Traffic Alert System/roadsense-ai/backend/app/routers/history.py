"""Prediction history listing, detail, delete, and aggregate stats."""
from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps import get_current_user
from app.database import get_database
from app.schemas.prediction import (
    HistoryDetailResponse,
    HistoryItem,
    HistoryListResponse,
    HistoryStatsResponse,
)

router = APIRouter(prefix="/history", tags=["history"])


def _item(doc: dict) -> HistoryItem:
    src = doc.get("source_location") or {}
    lat = src.get("lat")
    lng = src.get("lng")
    input_features = doc.get("input_features") or {}
    return HistoryItem(
        id=str(doc["_id"]),
        prediction_type=doc["prediction_type"],
        risk_score=float(doc["risk_score"]),
        severity_level=doc["severity_level"],
        city=doc.get("city", ""),
        weather_condition=str(input_features.get("weather_condition") or "Unknown"),
        created_at=doc["created_at"].isoformat() if doc.get("created_at") else "",
        latitude=float(lat) if lat is not None else None,
        longitude=float(lng) if lng is not None else None,
    )


@router.get("/stats", response_model=HistoryStatsResponse)
async def history_stats(current: dict = Depends(get_current_user)) -> HistoryStatsResponse:
    """Aggregated counts for dashboard charts (current user only)."""
    db = get_database()
    uid = current["_id"]
    total = await db["predictions"].count_documents({"user_id": uid})

    # Alerts: High or Critical severity
    alerts = await db["predictions"].count_documents(
        {
            "user_id": uid,
            "severity_level": {"$in": ["High", "Critical"]},
        }
    )
    safe_routes = await db["predictions"].count_documents(
        {
            "user_id": uid,
            "prediction_type": "route",
            "severity_level": {"$in": ["Low", "Medium"]},
        }
    )

    by_severity: dict[str, int] = {}
    by_city: dict[str, int] = {}
    cursor = db["predictions"].find({"user_id": uid}, {"severity_level": 1, "city": 1})
    async for doc in cursor:
        sev = doc.get("severity_level", "Unknown")
        by_severity[sev] = by_severity.get(sev, 0) + 1
        c = doc.get("city") or "Unknown"
        by_city[c] = by_city.get(c, 0) + 1

    return HistoryStatsResponse(
        total_predictions=total,
        alerts_count=alerts,
        safe_routes_count=safe_routes,
        by_severity=by_severity,
        by_city=by_city,
    )


@router.get("/", response_model=HistoryListResponse)
async def list_history(
    page: int = Query(1, ge=1),
    # Cap high enough for heatmap-style bulk fetch (frontend uses up to 400–500).
    limit: int = Query(20, ge=1, le=500),
    city: str | None = None,
    severity: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    current: dict = Depends(get_current_user),
) -> HistoryListResponse:
    """Paginated prediction history with optional filters."""
    db = get_database()
    q: dict = {"user_id": current["_id"]}
    if city:
        q["city"] = {"$regex": city, "$options": "i"}
    if severity:
        q["severity_level"] = severity
    if date_from or date_to:
        q["created_at"] = {}
        if date_from:
            q["created_at"]["$gte"] = datetime.fromisoformat(date_from)
        if date_to:
            q["created_at"]["$lte"] = datetime.fromisoformat(date_to)

    total = await db["predictions"].count_documents(q)
    cursor = (
        db["predictions"]
        .find(q)
        .sort("created_at", -1)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    items = [_item(d) async for d in cursor]
    return HistoryListResponse(items=items, total=total, page=page, limit=limit)


@router.get("/{prediction_id}", response_model=HistoryDetailResponse)
async def get_history_item(
    prediction_id: str,
    current: dict = Depends(get_current_user),
) -> HistoryDetailResponse:
    """Fetch a single prediction owned by the current user."""
    try:
        oid = ObjectId(prediction_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid id") from exc

    db = get_database()
    doc = await db["predictions"].find_one({"_id": oid, "user_id": current["_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return HistoryDetailResponse(
        id=str(doc["_id"]),
        prediction_type=doc["prediction_type"],
        input_features=doc.get("input_features", {}),
        risk_score=float(doc["risk_score"]),
        severity_level=doc["severity_level"],
        accident_occurred_prediction=int(doc.get("accident_occurred_prediction", 0)),
        source_location=doc.get("source_location"),
        destination_location=doc.get("destination_location"),
        waypoint_risks=doc.get("waypoint_risks"),
        city=doc.get("city", ""),
        created_at=doc["created_at"].isoformat() if doc.get("created_at") else "",
    )


@router.delete("/{prediction_id}")
async def delete_history_item(
    prediction_id: str,
    current: dict = Depends(get_current_user),
) -> dict:
    """Delete one prediction row for the authenticated user."""
    try:
        oid = ObjectId(prediction_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid id") from exc

    db = get_database()
    res = await db["predictions"].delete_one({"_id": oid, "user_id": current["_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    await db["users"].update_one(
        {"_id": current["_id"]},
        {"$inc": {"total_predictions": -1}},
    )
    return {"ok": True}
