import pytest

from app.analysis.agroalert_indicators import (
    aggregate_daily,
    attach_percentiles,
    clean_value,
    moisture_status,
    weighted_mean,
)


@pytest.mark.parametrize(
    ("percentile", "label"),
    [
        (9.9, "Muy baja"),
        (10, "Baja"),
        (24.9, "Baja"),
        (25, "Moderada-baja"),
        (39.9, "Moderada-baja"),
        (40, "Normal"),
        (60, "Normal"),
        (60.1, "Alta"),
        (None, "Sin dato"),
    ],
)
def test_status_boundaries(percentile, label):
    assert moisture_status(percentile)[0] == label


def test_percentiles_ties_and_missing():
    rows = [{"SFMC": x, "RZMC": None} for x in [1, 1, 2, 3, 4, -999]]
    result = attach_percentiles(rows, "SFMC", "RZMC")
    assert [r["SFMC_PRCNTL"] for r in result] == [30, 30, 60, 80, 100, None]
    assert all(r["RZMC_PRCNTL"] is None for r in result)
    assert all(r["SFMC_PRCNTL"] is None for r in attach_percentiles(rows[:4], "SFMC", "RZMC"))
    assert clean_value(float("inf")) is None
    assert clean_value(-900) is None


def test_aggregation_does_not_mix_sources():
    rows = [
        {"date": "2026-01-01", "source_model": "SMAP", "coverage_percent": 25, "SFMC": 0.1},
        {"date": "2026-01-01", "source_model": "SMAP", "coverage_percent": 75, "SFMC": 0.3},
        {"date": "2026-01-01", "source_model": "MERRA-2", "coverage_percent": 50, "GWETTOP": 0.8},
    ]
    result = aggregate_daily(rows)
    assert len(result) == 2
    assert next(row for row in result if row["source_model"] == "SMAP")["SFMC"] == 0.25
    assert next(row for row in result if row["source_model"] == "MERRA-2")["SFMC"] is None
    assert weighted_mean([{"SFMC": 0.2}, {"SFMC": 0.4}], "SFMC") == 0.3
    assert weighted_mean([{"SFMC": None}], "SFMC") is None
