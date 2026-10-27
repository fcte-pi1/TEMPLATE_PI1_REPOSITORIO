import socket
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine
from app.main import app
from app.mock.maze import build_seed_maze
from app.mock.seed import build_seed_path

try:
    socket.create_connection((settings.POSTGRES_HOST, settings.POSTGRES_PORT), timeout=1).close()
except OSError:
    pytest.skip(
        f"banco fora do ar na porta {settings.POSTGRES_PORT}: rode docker compose up -d backend",
        allow_module_level=True,
    )

client = TestClient(app)

def test_health_reports_database_connected():
    r = client.get("/health")
    assert r.json() == {"status": "ok", "database": "connected"}, r.json()


def test_seed_in_database_matches_mock():
    with engine.connect() as conn:
        execucao = conn.execute(text(
            "SELECT e.id, e.quantidade_celulas_visitadas FROM execucao e "
            "JOIN labirinto l ON l.id = e.labirinto_id WHERE l.nome = 'seed 4x4'"
        )).one_or_none()
        if execucao is None:
            pytest.skip("seed não gravado: rode python -m app.mock.seed_db")
        execucao_id, celulas_visitadas = execucao

        posicoes = conn.execute(text(
            "SELECT pos_x, pos_y FROM amostra_telemetria "
            "WHERE execucao_id = :id ORDER BY tempo_relativo_ms"
        ), {"id": execucao_id}).all()
        paredes = conn.execute(text(
            "SELECT celula_x, celula_y, lado FROM parede_detectada WHERE execucao_id = :id"
        ), {"id": execucao_id}).all()

    trajetoria = build_seed_path()
    assert [tuple(p) for p in posicoes] == [(p.col, p.row) for p in trajetoria]
    assert celulas_visitadas == len({(p.row, p.col) for p in trajetoria})

    grid = build_seed_maze().grid
    esperadas = {
        (col, row, lado)
        for row, linha in enumerate(grid)
        for col, cell in enumerate(linha)
        for lado in ("norte", "sul", "leste", "oeste")
        if getattr(cell, f"parede_{lado}")
    }
    assert {tuple(p) for p in paredes} == esperadas
