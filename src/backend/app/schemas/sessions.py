from typing import Literal

from pydantic import BaseModel


class StartExecutionInput(BaseModel):
    tipo: Literal["4x4", "8x4", "12x4"] = "4x4"


class FinishExecutionInput(BaseModel):
    status: Literal["concluido", "interrompido"] = "concluido"
    resultado: Literal["sucesso", "falha"] | None = None
