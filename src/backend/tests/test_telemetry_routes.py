from datetime import datetime

import pytest
from fastapi import HTTPException

from app.routes.telemetry import get_current_telemetry
from app.services.telemetry_service import telemetry_service


class FakeResult:
    def __init__(self, sample):
        self.sample = sample

    def mappings(self):
        return self

    def first(self):
        return self.sample


class FakeDB:
    def __init__(self, sample):
        self.sample = sample

    def execute(self, query):
        assert "FROM amostra_telemetria" in str(query)
        return FakeResult(self.sample)


def test_current_telemetry_returns_last_database_sample(monkeypatch):
    monkeypatch.setattr(telemetry_service, "get_connection_status", lambda: {
        "connected": True,
        "last_seen": datetime(2026, 10, 19, 12, 0),
        "age_ms": 250.0,
    })
    sample = {
        "telemetry_sample_id": 23,
        "execucao_id": 2,
        "tempo_relativo_ms": 1500,
        "nivel_bateria_pct": 87.0,
        "consumo_eletrico_ma": 0.0,
        "velocidade_instantanea_cm_s": 0.325,
        "rpm_motor_esq": 120,
        "rpm_motor_dir": 120,
        "giro_x_deg_s": 0.0,
        "giro_y_deg_s": 0.0,
        "giro_z_deg_s": 0.0,
        "pos_x": 3,
        "pos_y": 1,
        "generated_at": datetime(2026, 10, 19, 12, 0, 1, 500000),
    }

    result = get_current_telemetry(db=FakeDB(sample))

    assert result["execucao_id"] == 2
    assert result["telemetry_sample_id"] == 23
    assert result["position"] == {"row": 1, "col": 3}
    assert result["metrics"]["rpm"] == 120
    assert result["connected"] is True
    assert result["stale"] is False


def test_current_telemetry_returns_503_when_database_is_empty():
    with pytest.raises(HTTPException) as error:
        get_current_telemetry(db=FakeDB(None))

    assert error.value.status_code == 503
