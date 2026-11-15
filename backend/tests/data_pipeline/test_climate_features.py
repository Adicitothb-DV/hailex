from datetime import date

import pandas as pd
import pytest

from app.services.power import PowerError
from scripts.data_pipeline.climate_features import add_scenarios, features, period
from scripts.data_pipeline.climate_history import REGIONS, checked_payload


def test_national_statistical_windows_and_perennial():
    assert period(2021, "Otoño-Invierno", "cebada") == (date(2020, 10, 1), date(2021, 9, 30))
    assert period(2021, "Primavera-Verano", "sorgo") == (date(2021, 3, 1), date(2022, 3, 31))
    assert period(2021, "Perennes", "alfalfa") == (date(2020, 10, 1), date(2021, 9, 30))
    assert period(2021, "Perennes", "sorgo") is None


def daily():
    dates = pd.date_range("2020-10-01", "2021-09-30")
    return pd.DataFrame(
        {
            "region_id": "colon_queretaro",
            "date": dates,
            "T2M": 20.0,
            "PRECTOTCORR": 2.0,
            "ALLSKY_SFC_SW_DWN": 10.0,
        }
    )


def test_aggregate_coverage_and_missing_no_imputation():
    source = daily()
    row = features(source, "colon_queretaro", 2021, "Perennes", "alfalfa")
    assert row["expected_days"] == 365 and row["precip_total_mm"] == 730
    assert row["solar_sum_mj_m2"] == 3650 and row["t2m_mean_c"] == 20
    assert row["precip_wet_days_ge_1mm"] == 365
    assert row["time_standard"] == "UTC"
    source.loc[0, "PRECTOTCORR"] = None
    missing = features(source, "colon_queretaro", 2021, "Perennes", "alfalfa")
    assert missing["climate_status"] == "incomplete"
    assert missing["PRECTOTCORR_missing_days"] == 1
    assert "precip_total_mm" not in missing
    other = features(source, "el_marques_queretaro", 2021, "Perennes", "alfalfa")
    assert other["T2M_valid_days"] == 0


def test_dry_spell_and_invalid_precipitation():
    source = daily()
    source.loc[:4, "PRECTOTCORR"] = 0
    row = features(source, "colon_queretaro", 2021, "Perennes", "alfalfa")
    assert row["precip_max_consecutive_dry_days_lt_1mm"] == 5
    source.loc[0, "PRECTOTCORR"] = -1
    assert (
        features(source, "colon_queretaro", 2021, "Perennes", "alfalfa")["climate_status"]
        == "invalid_physical_values"
    )


def test_scenarios_are_retrospective_and_require_sufficient_data():
    rows = [
        {
            "region_id": "colon_queretaro",
            "agricultural_cycle": "Perennes",
            "crop_name": "alfalfa",
            "climate_status": "complete_approximate",
            "precip_total_mm": n,
            "t2m_mean_c": n,
        }
        for n in range(10)
    ]
    out = add_scenarios(pd.DataFrame(rows))
    assert out.iloc[0]["precip_scenario_exploratory"] == "more_dry"
    assert out.iloc[-1]["temperature_scenario_exploratory"] == "warmer"
    assert add_scenarios(pd.DataFrame(rows[:9]))["precip_scenario_exploratory"].isna().all()


def test_power_normalizer_rejects_wrong_timezone_and_unit():
    import json

    payload = {
        "header": {
            "api": {"version": "1"},
            "time_standard": "LST",
            "start": "20250101",
            "end": "20250101",
            "fill_value": -999,
        },
        "geometry": {"type": "Point", "coordinates": [-100.045, 20.788]},
        "properties": {"parameter": {"T2M": {"20250101": 20}}},
        "parameters": {"T2M": {"units": "C"}},
    }

    def raw():
        return json.dumps(payload).encode()

    with pytest.raises(PowerError):
        checked_payload(raw(), date(2025, 1, 1), date(2025, 1, 1), REGIONS["colon_queretaro"])
    payload["header"]["time_standard"] = "UTC"
    payload["parameters"]["T2M"]["units"] = "K"
    with pytest.raises(PowerError):
        checked_payload(raw(), date(2025, 1, 1), date(2025, 1, 1), REGIONS["colon_queretaro"])


def test_join_and_reproducibility_with_synthetic_sources(tmp_path, monkeypatch):
    import hashlib

    from scripts.data_pipeline import run_climate_pipeline as pipeline

    source = tmp_path / "input.csv"
    rows = [
        {
            "region_id": "colon_queretaro",
            "year": 2025,
            "agricultural_cycle": "Otoño-Invierno",
            "crop_name": "cebada",
            "irrigation_mode": "Riego",
        },
        {
            "region_id": "colon_queretaro",
            "year": 2025,
            "agricultural_cycle": "Otoño-Invierno",
            "crop_name": "cebada",
            "irrigation_mode": "Temporal",
        },
        {
            "region_id": "el_marques_queretaro",
            "year": 2025,
            "agricultural_cycle": "Primavera-Verano",
            "crop_name": "sorgo",
            "irrigation_mode": "Riego",
        },
    ]
    pd.DataFrame(rows).to_csv(source, index=False)
    original = source.read_bytes()
    monkeypatch.setattr(pipeline, "cached", lambda region: None)
    monkeypatch.setattr(
        pipeline,
        "fixture",
        lambda region: (region.encode(), {"retrieved_at_utc": "2025-01-01T00:00:00Z"}),
    )

    def checked(raw, start, end, coords):
        from types import SimpleNamespace

        region = raw.decode()
        point = SimpleNamespace(
            date=date(2025, 1, 1),
            T2M=10 if region.startswith("colon") else 20,
            PRECTOTCORR=2,
            ALLSKY_SFC_SW_DWN=3,
        )
        return (
            {},
            [point],
            [SimpleNamespace(id=name) for name in ("T2M", "PRECTOTCORR", "ALLSKY_SFC_SW_DWN")],
            [],
        )

    monkeypatch.setattr(pipeline, "checked_payload", checked)
    output, panel = tmp_path / "out", tmp_path / "panel.csv"
    result = pipeline.build(source, output, panel)
    first = panel.read_bytes()
    pipeline.build(source, output, panel)
    assert panel.read_bytes() == first and source.read_bytes() == original
    assert result["panel_rows"] == 3
    df = pd.read_csv(panel)
    assert df["irrigation_mode"].tolist() == ["Riego", "Temporal", "Riego"]
    assert df.loc[0, "T2M_valid_days"] == df.loc[1, "T2M_valid_days"] == 1
    assert df.loc[2, "T2M_valid_days"] == 0
    assert hashlib.sha256(source.read_bytes()).digest() == hashlib.sha256(original).digest()
