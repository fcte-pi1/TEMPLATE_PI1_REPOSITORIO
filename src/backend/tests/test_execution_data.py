import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.mock import state
from app.mock.seed import EXECUTION_ID
from app.routes.sessions import get_session_telemetry
from fastapi import HTTPException

client = TestClient(app)


class FakeResult:
    def __init__(self, scalar=None, rows=None):
        self.scalar = scalar
        self.rows = rows or []

    def scalar_one_or_none(self):
        return self.scalar

    def scalar_one(self):
        return self.scalar

    def mappings(self):
        return self

    def all(self):
        return self.rows


class FakeTelemetryDB:
    def __init__(self, exists=True):
        self.exists = exists

    def execute(self, query, params):
        sql = str(query)
        if "SELECT id FROM execucao" in sql:
            return FakeResult(scalar=2 if self.exists else None)
        if "SELECT COUNT(*)" in sql:
            return FakeResult(scalar=1)
        if "FROM amostra_telemetria t" in sql:
            return FakeResult(rows=[{
                "id": 12,
                "execucao_id": 2,
                "tempo_relativo_ms": 500,
                "nivel_bateria_pct": 87.0,
                "consumo_eletrico_ma": 0.0,
                "velocidade_instantanea_cm_s": 0.325,
                "rpm_motor_esq": 120,
                "rpm_motor_dir": 120,
                "giro_x_deg_s": 0.0,
                "giro_y_deg_s": 0.0,
                "giro_z_deg_s": 0.0,
                "pos_x": 0,
                "pos_y": 0,
            }])
        raise AssertionError(f"SQL inesperado: {sql}")


def test_session_telemetry_returns_execution_samples():
    result = get_session_telemetry(2, limit=50, offset=0, db=FakeTelemetryDB())

    assert result["execucao_id"] == 2
    assert result["total"] == 1
    assert result["samples"][0]["rpm_motor_esq"] == 120
    assert result["samples"][0]["pos_x"] == 0


def test_session_telemetry_returns_404_for_unknown_execution():
    with pytest.raises(HTTPException) as error:
        get_session_telemetry(999, limit=100, offset=0, db=FakeTelemetryDB(exists=False))

    assert error.value.status_code == 404

def test_maze_returns_grid():
    r = client.get(f"/api/sessions/{EXECUTION_ID}/maze")
    assert r.status_code == 200
    body = r.json()

    n = body["size"]
    assert len(body["grid"]) == n
    assert all(len(row) == n for row in body["grid"])

    # start e goal dentro do grid
    assert 0 <= body["start"]["row"] < n
    assert 0 <= body["start"]["col"] < n
    assert 0 <= body["goal"]["row"] < n
    assert 0 <= body["goal"]["col"] < n
    assert body["start"] != body["goal"]

    for row in body["grid"]:
        for cell in row:
            assert set(cell.keys()) =={
                "parede_norte", "parede_sul", "parede_leste", "parede_oeste",
            }
            assert all(isinstance(v, bool) for v in cell.values())

def test_path_returns_trajectory():
    r = client.get(f"/api/sessions/{EXECUTION_ID}/path")
    assert r.status_code == 200
    assert len(r.json()) == len(state.path)

@pytest.mark.parametrize("resource", ["maze", "path", "metrics", "events"])
def test_returns_404_for_unknown_session(resource):
    r = client.get(f"/api/sessions/unknown_session/{resource}")
    assert r.status_code == 404
    assert r.json() == {"detail": "No active session found"}


@pytest.mark.parametrize("resource", ["maze", "path", "metrics", "events"])
def test_path_returns_404_when_no_session(resource):
    saved = state.execution
    state.execution = None
    try:
        r = client.get(f"/api/sessions/{EXECUTION_ID}/{resource}")
        assert r.status_code == 404
        assert r.json() == {"detail": "No active session found"}
    finally:
        state.execution = saved

def test_metrics_returns_current_metrics():
    r = client.get(f"/api/sessions/{EXECUTION_ID}/metrics")
    assert r.status_code == 200
    assert set(r.json().keys()) == {"speed_cm_s", "rpm", "battery_pct"}

def test_events_returns_log():
    r = client.get(f"/api/sessions/{EXECUTION_ID}/events")
    assert r.status_code == 200
    assert len(r.json()) == len(state.events)
    
