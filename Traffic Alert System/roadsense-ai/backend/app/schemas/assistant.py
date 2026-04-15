"""Schemas for assistant chat endpoint."""
from pydantic import BaseModel, Field


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


class AssistantPredictionItem(BaseModel):
    id: str
    prediction_type: str
    risk_score: float
    severity_level: str
    city: str = ""
    created_at: str = ""


class AssistantChartSlice(BaseModel):
    name: str
    value: float
    color: str


class AssistantChartData(BaseModel):
    chart_type: str = "pie"
    title: str
    slices: list[AssistantChartSlice] = []


class AssistantChatResponse(BaseModel):
    reply: str
    predictions: list[AssistantPredictionItem] = []
    chart: AssistantChartData | None = None
    charts: list[AssistantChartData] = []
