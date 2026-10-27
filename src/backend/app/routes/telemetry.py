from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.schemas.telemetry import EspTelemetryInput, TelemetryData
from app.services.telemetry_service import telemetry_service


router = APIRouter(
    prefix="/telemetry",
    tags=["Telemetry"],
)


@router.get("/status")
def get_esp_connection_status():
    """Estado de conexão inferido pelo recebimento recente de pacotes da ESP."""
    return telemetry_service.get_connection_status()

@router.get(
    "/current",
)
def get_current_telemetry(db: Session = Depends(get_db)):
    """Busca no banco a última amostra recebida, priorizando execução ativa."""
    sample = db.execute(
        text(
            "SELECT t.id AS telemetry_sample_id, t.execucao_id, "
            "t.tempo_relativo_ms, t.nivel_bateria_pct, t.consumo_eletrico_ma, "
            "t.velocidade_instantanea_cm_s, t.rpm_motor_esq, t.rpm_motor_dir, "
            "m.giro_x_deg_s, m.giro_y_deg_s, m.giro_z_deg_s, m.pos_x, m.pos_y, "
            "e.iniciada_em + (t.tempo_relativo_ms * INTERVAL '1 millisecond') "
            "AS generated_at "
            "FROM amostra_telemetria t "
            "JOIN execucao e ON e.id = t.execucao_id "
            "LEFT JOIN LATERAL ("
            "  SELECT giro_x_deg_s, giro_y_deg_s, giro_z_deg_s, pos_x, pos_y "
            "  FROM amostra_movimento "
            "  WHERE execucao_id = t.execucao_id "
            "    AND tempo_relativo_ms = t.tempo_relativo_ms "
            "  ORDER BY id DESC LIMIT 1"
            ") m ON TRUE "
            "ORDER BY (e.status = 'em_execucao') DESC, t.id DESC LIMIT 1"
        )
    ).mappings().first()

    if sample is None:
        raise HTTPException(
            status_code=503,
            detail="Nenhuma telemetria salva no banco.",
        )

    connection = telemetry_service.get_connection_status()
    return {
        "execucao_id": sample["execucao_id"],
        "telemetry_sample_id": sample["telemetry_sample_id"],
        "tempo_relativo_ms": sample["tempo_relativo_ms"],
        "position": {"row": sample["pos_y"], "col": sample["pos_x"]},
        "metrics": {
            "speed_cm_s": sample["velocidade_instantanea_cm_s"],
            "rpm": sample["rpm_motor_esq"],
            "battery_pct": sample["nivel_bateria_pct"],
        },
        "movement": {
            "giro_x_deg_s": sample["giro_x_deg_s"],
            "giro_y_deg_s": sample["giro_y_deg_s"],
            "giro_z_deg_s": sample["giro_z_deg_s"],
        },
        "events": [],
        "generated_at": sample["generated_at"],
        "served_at": connection["last_seen"],
        "age_ms": connection["age_ms"],
        "stale": not connection["connected"],
        "connected": connection["connected"],
    }


@router.post("")
def receive_telemetry(
    telemetry: EspTelemetryInput | TelemetryData,
    db: Session = Depends(get_db),
):
    """Recebe uma amostra da ESP e salva na execução ativa."""
    reported_connected = (
        telemetry.connected if isinstance(telemetry, EspTelemetryInput) else True
    )
    telemetry_service.mark_esp_packet_received(reported_connected)

    execution = db.execute(
        text(
            "SELECT id, FLOOR(EXTRACT(EPOCH FROM "
            "(LOCALTIMESTAMP - iniciada_em)) * 1000)::integer AS elapsed_ms "
            "FROM execucao "
            "WHERE status = 'em_execucao' ORDER BY iniciada_em DESC LIMIT 1"
        )
    ).mappings().first()

    if execution is None:
        raise HTTPException(
            status_code=409,
            detail="Não existe execução ativa para associar a telemetria.",
        )

    elapsed_ms = max(0, execution["elapsed_ms"])
    if isinstance(telemetry, TelemetryData):
        battery = telemetry.metrics.battery_pct
        speed = telemetry.metrics.speed_cm_s
        rpm = int(telemetry.metrics.rpm)
        pos_x = telemetry.position.col
        pos_y = telemetry.position.row
    else:
        battery = telemetry.battery_pct
        speed = telemetry.speed_cm_s
        rpm = telemetry.rpm
        pos_x = 0
        pos_y = 0

    last_telemetry = db.execute(
        text(
            "SELECT tempo_relativo_ms, nivel_bateria_pct, "
            "velocidade_instantanea_cm_s, rpm_motor_esq "
            "FROM amostra_telemetria WHERE execucao_id = :execucao_id "
            "ORDER BY id DESC LIMIT 1"
        ),
        {"execucao_id": execution["id"]},
    ).mappings().first()
    last_movement = db.execute(
        text(
            "SELECT pos_x, pos_y FROM amostra_movimento "
            "WHERE execucao_id = :execucao_id ORDER BY id DESC LIMIT 1"
        ),
        {"execucao_id": execution["id"]},
    ).mappings().first()

    if last_telemetry is not None and last_movement is not None:
        unchanged = (
            round(last_telemetry["nivel_bateria_pct"], 1) == round(battery, 1)
            and round(last_telemetry["velocidade_instantanea_cm_s"], 2) == round(speed, 2)
            and last_telemetry["rpm_motor_esq"] == rpm
            and last_movement["pos_x"] == pos_x
            and last_movement["pos_y"] == pos_y
        )
        time_since_last_sample_ms = elapsed_ms - last_telemetry["tempo_relativo_ms"]
        if (
            unchanged
            and time_since_last_sample_ms < settings.TELEMETRY_HEARTBEAT_INTERVAL_MS
        ):
            return {
                "status": "unchanged",
                "saved": False,
                "execucao_id": execution["id"],
                "next_sample_in_ms": max(
                    0,
                    settings.TELEMETRY_HEARTBEAT_INTERVAL_MS
                    - time_since_last_sample_ms,
                ),
            }

    inserted_id = db.execute(
        text(
            "INSERT INTO amostra_telemetria ("
            "execucao_id, tempo_relativo_ms, nivel_bateria_pct, "
            "consumo_eletrico_ma, velocidade_instantanea_cm_s, rpm_motor_esq, rpm_motor_dir"
            ") VALUES ("
            ":execucao_id, :tempo_relativo_ms, :bateria, "
            "0, :velocidade, :rpm, :rpm"
            ") RETURNING id"
        ),
        {
            "execucao_id": execution["id"],
            "tempo_relativo_ms": elapsed_ms,
            "bateria": battery,
            "velocidade": speed,
            "rpm": rpm,
        },
    ).scalar_one()
    movement_id = db.execute(
        text(
            "INSERT INTO amostra_movimento ("
            "execucao_id, tempo_relativo_ms, giro_x_deg_s, giro_y_deg_s, "
            "giro_z_deg_s, pos_x, pos_y"
            ") VALUES (:execucao_id, :tempo_relativo_ms, 0, 0, 0, :pos_x, :pos_y) "
            "RETURNING id"
        ),
        {
            "execucao_id": execution["id"],
            "tempo_relativo_ms": elapsed_ms,
            "pos_x": pos_x,
            "pos_y": pos_y,
        },
    ).scalar_one()
    db.commit()

    return {
        "status": "saved",
        "saved": True,
        "execucao_id": execution["id"],
        "telemetry_sample_id": inserted_id,
        "movement_sample_id": movement_id,
    }
