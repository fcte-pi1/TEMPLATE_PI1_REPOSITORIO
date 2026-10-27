from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.schemas.telemetry import (
    MetricsData,
    PositionData,
    TelemetryData,
)
from app.services.telemetry_service import TelemetryService


def build_telemetry(
    generated_at: datetime,
    row: int = 0,
    col: int = 0,
) -> TelemetryData:
    return TelemetryData(
        position=PositionData(
            row=row,
            col=col,
        ),
        metrics=MetricsData(
            speed_cm_s=18.0,
            rpm=101.0,
            battery_pct=90.0,
        ),
        events=[],
        generated_at=generated_at,
    )


def test_recent_telemetry_is_not_stale():
    service = TelemetryService()

    telemetry = build_telemetry(
        generated_at=datetime.now(timezone.utc)
    )

    service.update(telemetry)

    result = service.get_current()

    assert result is not None
    assert result.stale is False
    assert result.age_ms >= 0


def test_delayed_telemetry_is_stale():
    service = TelemetryService()

    stale_limit_ms = (
        settings.TELEMETRY_UPDATE_INTERVAL_MS
        + settings.TELEMETRY_LATENCY_TOLERANCE_MS
    )

    telemetry = build_telemetry(
        generated_at=(
            datetime.now(timezone.utc)
            - timedelta(
                milliseconds=stale_limit_ms + 500
            )
        )
    )

    service.update(telemetry)

    result = service.get_current()

    assert result is not None
    assert result.stale is True
    assert result.age_ms > stale_limit_ms


def test_packet_loss_keeps_last_valid_data():
    service = TelemetryService()

    telemetry = build_telemetry(
        generated_at=datetime.now(timezone.utc),
        row=2,
        col=3,
    )

    service.update(telemetry)

    result = service.get_current()

    assert result is not None

    assert result.position.row == 2
    assert result.position.col == 3


def test_out_of_order_data_is_ignored():
    service = TelemetryService()

    now = datetime.now(timezone.utc)

    newer = build_telemetry(
        generated_at=now,
        row=5,
        col=5,
    )

    older = build_telemetry(
        generated_at=now - timedelta(seconds=1),
        row=1,
        col=1,
    )

    accepted_newer = service.update(newer)
    accepted_older = service.update(older)

    result = service.get_current()

    assert accepted_newer is True
    assert accepted_older is False

    assert result is not None
    assert result.position.row == 5
    assert result.position.col == 5


def test_burst_keeps_most_recent_data():
    service = TelemetryService()

    now = datetime.now(timezone.utc)

    telemetry_1 = build_telemetry(
        generated_at=now,
        row=1,
        col=1,
    )

    telemetry_2 = build_telemetry(
        generated_at=now + timedelta(milliseconds=100),
        row=2,
        col=2,
    )

    telemetry_3 = build_telemetry(
        generated_at=now + timedelta(milliseconds=200),
        row=3,
        col=3,
    )

    service.update(telemetry_1)
    service.update(telemetry_2)
    service.update(telemetry_3)

    result = service.get_current()

    assert result is not None
    assert result.position.row == 3
    assert result.position.col == 3


def test_esp_connection_is_false_before_first_packet():
    service = TelemetryService()

    assert service.get_connection_status() == {
        "connected": False,
        "last_seen": None,
        "age_ms": None,
    }


def test_recent_esp_packet_reports_connected():
    service = TelemetryService()
    service.mark_esp_packet_received()

    status = service.get_connection_status()

    assert status["connected"] is True
    assert status["last_seen"] is not None
    assert status["age_ms"] >= 0


def test_esp_reported_disconnected_is_respected():
    service = TelemetryService()
    service.mark_esp_packet_received(connected=False)

    assert service.get_connection_status()["connected"] is False


def test_old_esp_packet_reports_disconnected(monkeypatch):
    service = TelemetryService()
    monkeypatch.setattr(settings, "ESP_CONNECTION_TIMEOUT_MS", 1000)
    service._last_esp_received_at = datetime.now(timezone.utc) - timedelta(seconds=2)
    service._esp_reports_connected = True

    assert service.get_connection_status()["connected"] is False
