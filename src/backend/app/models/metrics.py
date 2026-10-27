from pydantic import BaseModel, Field

class Metrics(BaseModel):
    speed_cm_s: float = Field(..., ge=0)       # cm/s
    rpm: float = Field(..., ge=0)
    battery_pct: float = Field(..., ge=0, le=100)      # 0–100 (%)