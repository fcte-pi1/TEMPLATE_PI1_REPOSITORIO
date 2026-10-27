from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PositionData(BaseModel):
    row: int
    col: int


class MetricsData(BaseModel):
    speed_cm_s: float = Field(ge=0)
    rpm: float = Field(ge=0)
    battery_pct: float = Field(ge=0, le=100)


class TelemetryEventData(BaseModel):
    timestamp: datetime
    type: str
    message: str


class TelemetryData(BaseModel):
    position: PositionData
    metrics: MetricsData
    events: list[TelemetryEventData] = Field(default_factory=list)
    generated_at: datetime


class TelemetryResponse(TelemetryData):
    served_at: datetime
    age_ms: float
    stale: bool


class EspTelemetryInput(BaseModel):
    """Formato enviado pela rota HTTP da ESP."""

    model_config = ConfigDict(populate_by_name=True)

    battery_pct: float = Field(alias="bateria", ge=0, le=100)
    speed_cm_s: float = Field(alias="velocidade", ge=0)
    rpm: int = Field(alias="rpm_motor", ge=0)
    connected: bool = True
