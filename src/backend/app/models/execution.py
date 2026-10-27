from datetime import datetime
from enum import Enum
from pydantic import BaseModel

class ExecutionStatus(str, Enum):
    running = "em_execucao"
    finished = "concluido"
    interrupted = "interrompido"

class ExecutionResult(str, Enum):
    success = "sucesso"
    failure = "falha"

class Execution(BaseModel):
    id: str                 # ex: 0001
    labirinto_id: str
    iniciada_em: datetime
    finalizada_em: datetime | None = None
    status: ExecutionStatus 
    tempo_total_ms: int | None = None
    resultado: ExecutionResult | None = None
    velocidade_media_cm_s: float | None = None
    algorithm: str          #algo como "flood fill"
    criado_em: datetime
