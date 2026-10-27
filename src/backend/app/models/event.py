from datetime import datetime
from enum import Enum
from pydantic import BaseModel

class EventType(str, Enum):
    info = "info"
    warning = "warning"
    error = "error"
    decision = "decision"   # como exemplo: escolha de parede no Flood Fill

class Event(BaseModel):
    timestamp: datetime
    type: EventType
    message: str