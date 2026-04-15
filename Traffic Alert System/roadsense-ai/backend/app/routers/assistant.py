"""AI assistant routes backed by local Ollama."""
import json
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.database import get_database
from app.deps import get_current_user
from app.schemas.assistant import (
    AssistantChartData,
    AssistantChartSlice,
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantPredictionItem,
)

router = APIRouter(prefix="/assistant", tags=["assistant"])

SEVERITY_COLORS = {
    "Low": "#22c55e",
    "Medium": "#f59e0b",
    "High": "#f97316",
    "Critical": "#ef4444",
    "Unknown": "#94a3b8",
}


def _serialize_prediction(doc: dict) -> AssistantPredictionItem:
    return AssistantPredictionItem(
        id=str(doc["_id"]),
        prediction_type=doc.get("prediction_type", ""),
        risk_score=float(doc.get("risk_score", 0.0)),
        severity_level=doc.get("severity_level", "Unknown"),
        city=doc.get("city", ""),
        created_at=doc.get("created_at").isoformat() if doc.get("created_at") else "",
    )


def _is_predictions_query(text: str) -> bool:
    q = text.lower().strip()
    return (
        "get my predictions" in q
        or "show my predictions" in q
        or "list my predictions" in q
        or q == "my predictions"
    )


def _is_all_predictions_query(text: str) -> bool:
    q = text.lower().strip()
    return (
        "get all prediction" in q
        or "get all predictions" in q
        or "show all prediction" in q
        or "show all predictions" in q
        or "list all prediction" in q
        or "list all predictions" in q
        or q == "all predictions"
        or q == "all prediction"
    )


def _is_analyze_predictions_query(text: str) -> bool:
    q = text.lower().strip()
    return (
        "analyze prediction" in q
        or "analyse prediction" in q
        or "analyze my prediction" in q
        or "analyse my prediction" in q
        or "analyze all prediction" in q
        or "analyse all prediction" in q
        or "prediction analysis" in q
        or "analyze predictions" in q
        or "analyse predictions" in q
    )


def _build_severity_pie(predictions: list[AssistantPredictionItem]) -> AssistantChartData:
    counts: dict[str, int] = {}
    for p in predictions:
        key = (p.severity_level or "Unknown").title()
        counts[key] = counts.get(key, 0) + 1

    slices = [
        AssistantChartSlice(
            name=label,
            value=float(value),
            color=SEVERITY_COLORS.get(label, SEVERITY_COLORS["Unknown"]),
        )
        for label, value in counts.items()
    ]
    slices.sort(key=lambda x: x.value, reverse=True)
    return AssistantChartData(
        chart_type="pie",
        title="Predictions by Severity",
        slices=slices,
    )


def _build_prediction_type_chart(predictions: list[AssistantPredictionItem]) -> AssistantChartData:
    counts: dict[str, int] = {}
    palette = ["#0ea5e9", "#8b5cf6", "#14b8a6", "#eab308", "#ef4444"]
    for p in predictions:
        label = (p.prediction_type or "unknown").title()
        counts[label] = counts.get(label, 0) + 1

    labels = sorted(counts.keys(), key=lambda k: counts[k], reverse=True)
    slices = [
        AssistantChartSlice(
            name=label,
            value=float(counts[label]),
            color=palette[idx % len(palette)],
        )
        for idx, label in enumerate(labels)
    ]
    return AssistantChartData(
        chart_type="bar",
        title="Predictions by Type",
        slices=slices,
    )


def _build_city_risk_comparison(predictions: list[AssistantPredictionItem]) -> AssistantChartData:
    by_city: dict[str, list[float]] = {}
    palette = ["#22c55e", "#06b6d4", "#f59e0b", "#a855f7", "#ef4444"]
    for p in predictions:
        city = (p.city or "Unknown city").strip() or "Unknown city"
        by_city.setdefault(city, []).append(float(p.risk_score))

    ranked = sorted(
        (
            {
                "city": city,
                "avg_risk": round(sum(values) / len(values), 2),
                "count": len(values),
            }
            for city, values in by_city.items()
        ),
        key=lambda item: item["avg_risk"],
        reverse=True,
    )[:5]

    slices = [
        AssistantChartSlice(
            name=f"{row['city']} ({row['count']})",
            value=float(row["avg_risk"]),
            color=palette[idx % len(palette)],
        )
        for idx, row in enumerate(ranked)
    ]
    return AssistantChartData(
        chart_type="line",
        title="Top Cities by Average Risk",
        slices=slices,
    )


def _strip_markdown(text: str) -> str:
    cleaned = text.replace("\r", "\n")
    cleaned = re.sub(r"^\s{0,3}#{1,6}\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"\*\*(.*?)\*\*", r"\1", cleaned)
    cleaned = re.sub(r"__(.*?)__", r"\1", cleaned)
    cleaned = re.sub(r"\*(.*?)\*", r"\1", cleaned)
    cleaned = re.sub(r"_(.*?)_", r"\1", cleaned)
    cleaned = re.sub(r"`([^`]*)`", r"\1", cleaned)
    cleaned = re.sub(r"^\s*[-*+]\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*\d+\.\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()
    return cleaned or "I could not generate a response right now."


def _ask_ollama(user_message: str) -> str:
    endpoint = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/chat"
    payload = {
        "model": settings.OLLAMA_MODEL,
        "stream": False,
        "messages": [
            {"role": "system", "content": settings.OLLAMA_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
    }

    req = Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(req, timeout=90) as resp:
            body = resp.read().decode("utf-8")
            parsed = json.loads(body)
    except HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ollama request failed: {exc.reason}",
        ) from exc
    except URLError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Cannot connect to local Ollama. Ensure Ollama is running.",
        ) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to read response from Ollama",
        ) from exc

    response_text = (
        parsed.get("message", {}).get("content")
        or parsed.get("response")
        or "I could not generate a response right now."
    )
    return _strip_markdown(str(response_text))


@router.post("/chat", response_model=AssistantChatResponse)
async def assistant_chat(
    body: AssistantChatRequest,
    current: dict = Depends(get_current_user),
) -> AssistantChatResponse:
    """Chat endpoint with user-aware behavior for prediction history queries."""
    message = body.message.strip()
    if _is_analyze_predictions_query(message):
        db = get_database()
        cursor = db["predictions"].find({"user_id": current["_id"]}).sort("created_at", -1)
        rows = [_serialize_prediction(doc) async for doc in cursor]
        if not rows:
            return AssistantChatResponse(
                reply="You do not have any saved predictions to analyze yet.",
                predictions=[],
                chart=None,
            )

        severity_chart = _build_severity_pie(rows)
        type_chart = _build_prediction_type_chart(rows)
        city_chart = _build_city_risk_comparison(rows)
        charts = [severity_chart, type_chart, city_chart]
        model_rows = [
            {
                "id": p.id,
                "prediction_type": p.prediction_type,
                "risk_score": p.risk_score,
                "severity_level": p.severity_level,
                "city": p.city,
                "created_at": p.created_at,
            }
            for p in rows
        ]

        type_counts: dict[str, int] = {}
        city_stats: dict[str, dict[str, float]] = {}
        for p in rows:
            ptype = (p.prediction_type or "unknown").title()
            type_counts[ptype] = type_counts.get(ptype, 0) + 1
            ckey = (p.city or "Unknown city").strip() or "Unknown city"
            entry = city_stats.setdefault(ckey, {"count": 0.0, "risk_sum": 0.0})
            entry["count"] += 1.0
            entry["risk_sum"] += float(p.risk_score)

        city_comparison = [
            {
                "city": city,
                "count": int(stat["count"]),
                "avg_risk": round(stat["risk_sum"] / stat["count"], 2),
            }
            for city, stat in city_stats.items()
        ]
        city_comparison.sort(key=lambda row: row["avg_risk"], reverse=True)

        analysis_payload = {
            "instruction": (
                "Analyze this user's full traffic prediction history and provide concise actionable insights. "
                "Focus on severity distribution, city patterns, risk trends, and practical safety recommendations. "
                "Return plain text only. Do not use markdown, bullet symbols, tables, or code blocks."
            ),
            "user_prompt": message,
            "prediction_count": len(model_rows),
            "predictions": model_rows,
            "severity_comparison": [s.model_dump() for s in severity_chart.slices],
            "prediction_type_comparison": type_counts,
            "city_risk_comparison": city_comparison[:10],
        }
        answer = _ask_ollama(json.dumps(analysis_payload, ensure_ascii=True))
        return AssistantChatResponse(
            reply=answer,
            predictions=[],
            chart=severity_chart,
            charts=charts,
        )

    if _is_all_predictions_query(message) or _is_predictions_query(message):
        db = get_database()
        base_cursor = db["predictions"].find({"user_id": current["_id"]}).sort("created_at", -1)
        cursor = base_cursor if _is_all_predictions_query(message) else base_cursor.limit(20)
        rows = [_serialize_prediction(doc) async for doc in cursor]
        if not rows:
            return AssistantChatResponse(
                reply="You do not have any saved predictions yet.",
                predictions=[],
            )

        reply = (
            f"Found {len(rows)} prediction(s)."
            if _is_all_predictions_query(message)
            else f"Found {len(rows)} recent prediction(s)."
        )
        return AssistantChatResponse(reply=reply, predictions=rows)

    answer = _ask_ollama(message)
    return AssistantChatResponse(reply=answer, predictions=[])
