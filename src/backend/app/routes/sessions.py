from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.mock import state
from app.models import Execution
from app.models import PathPoint
from app.models import Metrics
from app.models import Event
from app.models import Maze
from app.schemas.sessions import FinishExecutionInput, StartExecutionInput

router = APIRouter(tags=["sessions"])
SESSION_NOT_FOUND = {"description": "No active session found"} #usar pra avisar o 404

def check_active_session(session_id: str) -> None: #da o 404 se nao existir
    if state.execution is None or state.execution.id != session_id:
        raise HTTPException(status_code=404, detail="No active session found")


@router.get("/sessions/active")
def get_active_session(db: Session = Depends(get_db)):
    execution = db.execute(
        text(
            "SELECT id, labirinto_id, iniciada_em, finalizada_em, tempo_total_ms, "
            "status, resultado, velocidade_media_cm_s, criado_em, algoritmo "
            "FROM execucao WHERE status = 'em_execucao' "
            "ORDER BY iniciada_em DESC LIMIT 1"
        )
    ).mappings().first()
    if execution is None:
        return None
    return {
        **dict(execution),
        "id": str(execution["id"]),
        "labirinto_id": str(execution["labirinto_id"]),
        "algorithm": execution["algoritmo"],
    }


@router.post("/sessions", status_code=201)
def start_execution(
    request: StartExecutionInput,
    db: Session = Depends(get_db),
):
    # Serializa inícios para impedir duas execuções ativas ao mesmo tempo.
    db.execute(text("SELECT pg_advisory_xact_lock(641927)"))
    active = db.execute(
        text("SELECT id FROM execucao WHERE status = 'em_execucao' LIMIT 1")
    ).scalar_one_or_none()
    if active is not None:
        raise HTTPException(status_code=409, detail="Já existe uma execução ativa.")

    maze_id = db.execute(
        text(
            "INSERT INTO labirinto (nome, tipo) VALUES (:nome, :tipo) "
            "ON CONFLICT (nome) DO UPDATE SET tipo = EXCLUDED.tipo RETURNING id"
        ),
        {"nome": f"Labirinto {request.tipo}", "tipo": request.tipo},
    ).scalar_one()
    execution = db.execute(
        text(
            "INSERT INTO execucao (labirinto_id, algoritmo, status) "
            "VALUES (:labirinto_id, 'Flood Fill', 'em_execucao') "
            "RETURNING id, labirinto_id, iniciada_em, status"
        ),
        {"labirinto_id": maze_id},
    ).mappings().one()
    db.commit()
    return {
        "id": str(execution["id"]),
        "labirinto_id": str(execution["labirinto_id"]),
        "iniciada_em": execution["iniciada_em"],
        "status": execution["status"],
        "algorithm": "Flood Fill",
    }


@router.post("/sessions/{session_id}/finish")
def finish_execution(
    session_id: int,
    request: FinishExecutionInput,
    db: Session = Depends(get_db),
):
    execution = db.execute(
        text(
            "UPDATE execucao SET status = :status, resultado = :resultado, "
            "finalizada_em = LOCALTIMESTAMP, "
            "tempo_total_ms = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM "
            "(LOCALTIMESTAMP - iniciada_em)) * 1000)::integer) "
            "WHERE id = :id AND status = 'em_execucao' "
            "RETURNING id, status, resultado, finalizada_em, tempo_total_ms"
        ),
        {
            "id": session_id,
            "status": request.status,
            "resultado": request.resultado,
        },
    ).mappings().first()
    if execution is None:
        raise HTTPException(status_code=404, detail="Execução ativa não encontrada.")
    db.commit()
    return dict(execution)


@router.get("/sessions/{session_id}/telemetry")
def get_session_telemetry(
    session_id: int,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Lista as amostras persistidas de telemetria de uma execução."""
    execution_id = db.execute(
        text("SELECT id FROM execucao WHERE id = :id"), {"id": session_id}
    ).scalar_one_or_none()
    if execution_id is None:
        raise HTTPException(status_code=404, detail="Execução não encontrada.")

    total = db.execute(
        text("SELECT COUNT(*) FROM amostra_telemetria WHERE execucao_id = :id"),
        {"id": session_id},
    ).scalar_one()
    samples = db.execute(
        text(
            "SELECT t.id, t.execucao_id, t.tempo_relativo_ms, "
            "t.nivel_bateria_pct, t.consumo_eletrico_ma, "
            "t.velocidade_instantanea_cm_s, t.rpm_motor_esq, t.rpm_motor_dir, "
            "m.giro_x_deg_s, m.giro_y_deg_s, m.giro_z_deg_s, m.pos_x, m.pos_y "
            "FROM amostra_telemetria t "
            "LEFT JOIN LATERAL ("
            "  SELECT giro_x_deg_s, giro_y_deg_s, giro_z_deg_s, pos_x, pos_y "
            "  FROM amostra_movimento "
            "  WHERE execucao_id = t.execucao_id "
            "    AND tempo_relativo_ms = t.tempo_relativo_ms "
            "  ORDER BY id DESC LIMIT 1"
            ") m ON TRUE "
            "WHERE t.execucao_id = :id "
            "ORDER BY t.tempo_relativo_ms, t.id "
            "LIMIT :limit OFFSET :offset"
        ),
        {"id": session_id, "limit": limit, "offset": offset},
    ).mappings().all()

    return {
        "execucao_id": session_id,
        "total": total,
        "limit": limit,
        "offset": offset,
        "samples": [dict(sample) for sample in samples],
    }

@router.get("/sessions/{session_id}/maze", response_model=Maze, responses={404: SESSION_NOT_FOUND})
def get_session_maze(session_id: str) -> Maze:
    check_active_session(session_id)
    return state.maze

@router.get("/sessions/{session_id}/path", response_model=list[PathPoint], responses={404: SESSION_NOT_FOUND})
def get_session_path(session_id: str) -> list[PathPoint] :
    check_active_session(session_id)
    return state.path

@router.get("/sessions/{session_id}/metrics", response_model=Metrics, responses={404: SESSION_NOT_FOUND})
def get_session_metrics(session_id: str) -> Metrics:
    check_active_session(session_id)
    return state.metrics

@router.get("/sessions/{session_id}/events", response_model=list[Event], responses={404: SESSION_NOT_FOUND})
def get_session_events(session_id: str) -> list[Event]:
    check_active_session(session_id)
    return state.events

