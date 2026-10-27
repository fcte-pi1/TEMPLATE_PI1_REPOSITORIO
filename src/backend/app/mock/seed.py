from datetime import datetime, timedelta, timezone

from app.models import (
    Execution, ExecutionStatus, ExecutionResult,
    PathPoint, Metrics,
    Event, EventType,
)

EXECUTION_ID = "0847"
LABIRINTO_ID = "maze_4x4"


def build_seed_execution() -> Execution:
    now = datetime.now(timezone.utc)
    path = build_seed_path()

    return Execution(
        id=EXECUTION_ID,
        labirinto_id=LABIRINTO_ID,
        iniciada_em=now - timedelta(seconds=42),
        finalizada_em=now,
        tempo_total_ms=42_000,
        status=ExecutionStatus.finished,
        resultado=ExecutionResult.success,
        velocidade_media_cm_s=12.5,
        criado_em=now - timedelta(seconds=45),
        algorithm="Flood Fill",
    )


def build_seed_metrics() -> Metrics:
    return Metrics(speed_cm_s=12.5, rpm=310.0, battery_pct=87.0)


def build_seed_path() -> list[PathPoint]:
    """
    Caminho inicial do robô a partir do start (0,0).
    Cada passo é vizinho ortogonal do anterior.
    Ainda NÃO chegou ao goal (a sessão está em execução).
    """
    return [
        PathPoint(row=0, col=0),
        PathPoint(row=1, col=0),
        PathPoint(row=2, col=0),
        PathPoint(row=3, col=0),
        PathPoint(row=3, col=1),
        PathPoint(row=3, col=2),
        PathPoint(row=3, col=3),
    ]


def build_seed_events() -> list[Event]:
    now = datetime.now(timezone.utc)
    return [
        Event(
            timestamp=now - timedelta(seconds=42),
            type=EventType.info,
            message="Sessão iniciada",
        ),
        Event(
            timestamp=now - timedelta(seconds=41),
            type=EventType.info,
            message="Flood Fill inicializado: distâncias calculadas",
        ),
        Event(
            timestamp=now - timedelta(seconds=30),
            type=EventType.decision,
            message="Decisão: seguir para leste (distância menor)",
        ),
        Event(
            timestamp=now - timedelta(seconds=15),
            type=EventType.info,
            message="Robô em movimento",
        ),
        Event(
            timestamp=now - timedelta(seconds=5),
            type=EventType.warning,
            message="Bateria abaixo de 90%",
        ),
    ]