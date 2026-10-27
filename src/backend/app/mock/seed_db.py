from sqlalchemy import text

from app.core.database import engine
from app.mock.maze import build_seed_maze
from app.mock.seed import build_seed_execution, build_seed_metrics, build_seed_path

execucao = build_seed_execution()
metricas = build_seed_metrics()
trajetoria = build_seed_path()
passo_ms = execucao.tempo_total_ms // (len(trajetoria) - 1)
with engine.begin() as conn:
    labirinto_id = conn.execute(
        text("INSERT INTO labirinto (nome, tipo) VALUES (:nome, :tipo) RETURNING id"),
        {"nome": "seed 4x4", "tipo": "4x4"},
    ).scalar_one()

    execucao_id = conn.execute(
        text(
            "INSERT INTO execucao (labirinto_id, iniciada_em, finalizada_em, tempo_total_ms,"
            "status, algoritmo, resultado, velocidade_media_cm_s, criado_em, quantidade_celulas_visitadas)"
            "VALUES (:labirinto_id, :iniciada_em, :finalizada_em, :tempo_total_ms,"
            ":status, :algoritmo, :resultado, :velocidade_media_cm_s, :criado_em, :quantidade_celulas_visitadas) RETURNING id"
        ),
        execucao.model_dump(exclude={"id", "algorithm"}) | {
            "labirinto_id": labirinto_id,
            "algoritmo": execucao.algorithm,
            "quantidade_celulas_visitadas": len({(p.row, p.col) for p in trajetoria}),
        },
    ).scalar_one()

    paredes = []
    for row, linha in enumerate(build_seed_maze().grid):
        for col, cell in enumerate(linha):
            for lado in ("norte", "sul", "leste", "oeste"):
                if getattr(cell, f"parede_{lado}"):
                    paredes.append({"execucao_id": execucao_id, "celula_x": col, "celula_y": row, "lado": lado})

    conn.execute(
        text(
            "INSERT INTO parede_detectada (execucao_id, celula_x, celula_y, lado)"
            "VALUES (:execucao_id, :celula_x, :celula_y, :lado)"
        ),
        paredes,
    )

    amostras = [
        {
            "execucao_id": execucao_id,
            "tempo_relativo_ms": i * passo_ms,
            "nivel_bateria_pct": metricas.battery_pct,
            "consumo_eletrico_ma": 866.0,
            "velocidade_instantanea_cm_s": metricas.speed_cm_s,
            "rpm_motor_esq": int(metricas.rpm),
            "rpm_motor_dir": int(metricas.rpm),
        }for i, ponto in enumerate(trajetoria)
    ]
    conn.execute(
        text(
            "INSERT INTO amostra_telemetria (execucao_id, tempo_relativo_ms,"
            "nivel_bateria_pct, consumo_eletrico_ma, velocidade_instantanea_cm_s, "
            "rpm_motor_esq, rpm_motor_dir)"
            "VALUES (:execucao_id, :tempo_relativo_ms,"
            ":nivel_bateria_pct, :consumo_eletrico_ma, :velocidade_instantanea_cm_s,"
            ":rpm_motor_esq, :rpm_motor_dir)"
        ),
        amostras,
    )
    movimentos = [
        {
            "execucao_id": execucao_id,
            "tempo_relativo_ms": i * passo_ms,
            "giro_x_deg_s": 0.0,
            "giro_y_deg_s": 0.0,
            "giro_z_deg_s": 0.0,
            "pos_x": ponto.col,
            "pos_y": ponto.row,
        }
        for i, ponto in enumerate(trajetoria)
    ]
    conn.execute(
        text(
            "INSERT INTO amostra_movimento (execucao_id, tempo_relativo_ms, "
            "giro_x_deg_s, giro_y_deg_s, giro_z_deg_s, pos_x, pos_y) "
            "VALUES (:execucao_id, :tempo_relativo_ms, :giro_x_deg_s, "
            ":giro_y_deg_s, :giro_z_deg_s, :pos_x, :pos_y)"
        ),
        movimentos,
    )
print(f"Seed gravado: execução {execucao_id}, {len(amostras)} amostras, {len(paredes)} paredes.")
