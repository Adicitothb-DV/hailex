"""Build an offline climate panel from existing snapshots and the SIAP observations."""

import hashlib
import json
from datetime import UTC, date, datetime
from pathlib import Path

import pandas as pd

from app.services.normalizer import METADATA
from scripts.data_pipeline.climate_features import add_scenarios, features
from scripts.data_pipeline.climate_history import (
    BACKEND,
    END,
    REGIONS,
    START,
    cached,
    checked_payload,
    fixture,
)


def build(source: Path, climate_output: Path, panel_output: Path) -> dict:
    before = source.read_bytes()
    observations = pd.read_csv(source)
    records, sources = [], []
    for region, coords in REGIONS.items():
        historical = cached(region)
        candidates = []
        if historical:
            candidates.append((*historical, START, END, "cached_historical_snapshot"))
        raw, info = fixture(region)
        candidates.append((raw, info, date(2025, 1, 1), date(2025, 12, 31), "historical_fixture"))
        for payload, manifest, start, end, mode in candidates:
            _, points, variables, warnings = checked_payload(payload, start, end, coords)
            for point in points:
                records.append(
                    {
                        "region_id": region,
                        "date": point.date,
                        **{v.id: getattr(point, v.id) for v in variables},
                    }
                )
            sources.append(
                {
                    "region_id": region,
                    "mode": mode,
                    "start": start.isoformat(),
                    "end": end.isoformat(),
                    "sha256": hashlib.sha256(payload).hexdigest(),
                    "retrieved_at_utc": manifest["retrieved_at_utc"],
                    "warnings": warnings,
                }
            )
    daily = pd.DataFrame(records)
    daily["date"] = pd.to_datetime(daily["date"])
    if daily.duplicated(["region_id", "date"]).any():
        raise ValueError("Overlapping POWER source snapshots")
    daily = daily.sort_values(["region_id", "date"]).reset_index(drop=True)
    keys = ["region_id", "year", "agricultural_cycle", "crop_name"]
    unique = observations[keys].drop_duplicates().sort_values(keys)
    seasonal = pd.DataFrame(
        [
            features(daily, row.region_id, int(row.year), row.agricultural_cycle, row.crop_name)
            for row in unique.itertuples(index=False)
        ]
    )
    seasonal = add_scenarios(seasonal)
    seasonal["latitude"] = seasonal["region_id"].map(lambda region: REGIONS[region][0])
    seasonal["longitude"] = seasonal["region_id"].map(lambda region: REGIONS[region][1])
    seasonal["spatial_resolution_meteorology"] = METADATA["T2M"][1]
    seasonal["spatial_resolution_solar"] = METADATA["ALLSKY_SFC_SW_DWN"][1]
    seasonal["source_id"] = "nasa-power-daily"
    panel = observations.merge(seasonal, how="left", on=keys, validate="many_to_one", sort=False)
    if len(panel) != len(observations):
        raise ValueError("Panel row count changed")
    report = {
        "daily_rows": len(daily),
        "siap_rows": len(observations),
        "panel_rows": len(panel),
        "seasonal_rows": len(seasonal),
        "seasonal_status": seasonal["climate_status"].value_counts().to_dict(),
        "available_years": {
            region: sorted(daily.loc[daily.region_id == region, "date"].dt.year.unique().tolist())
            for region in REGIONS
        },
        "seasonal_rows_with_missing_by_parameter": {
            key: int((seasonal[f"{key}_missing_days"] > 0).sum()) for key in METADATA
        },
        "baseline_status": "1991-2020 not acquired; anomalies not calculated",
        "scenario_status": "retrospective terciles from complete periods; hypothetical, not forecast",
    }
    manifest = {
        "processed_at_utc": datetime.now(UTC).isoformat(),
        "siap_sha256": hashlib.sha256(before).hexdigest(),
        "sources": sources,
        "coordinates": REGIONS,
        "community": "AG",
        "time_standard": "UTC",
        "parameter_metadata": {
            key: {"unit": v[0], "resolution": v[1], "data_type": v[2]}
            for key, v in METADATA.items()
        },
        "limitations": [
            "municipal reference points, not fields",
            "national windows are approximate, not phenology",
            "solar identical values do not prove shared cell",
            "scenario terciles use retrospective data and leak future information",
        ],
    }
    climate_output.mkdir(parents=True, exist_ok=True)
    panel_output.parent.mkdir(parents=True, exist_ok=True)
    daily.to_csv(
        climate_output / "daily_climate.csv",
        index=False,
        lineterminator="\n",
        date_format="%Y-%m-%d",
    )
    seasonal.to_csv(
        climate_output / "seasonal_climate_features.csv", index=False, lineterminator="\n"
    )
    panel.to_csv(panel_output, index=False, lineterminator="\n")
    for name, data in (
        ("climate_quality_report.json", report),
        ("climate_source_manifest.json", manifest),
    ):
        (climate_output / name).write_text(
            json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8"
        )
    if source.read_bytes() != before:
        raise ValueError("SIAP input changed during processing")
    return report


if __name__ == "__main__":
    print(
        json.dumps(
            build(
                BACKEND / "data/processed/siap/agricultural_observations.csv",
                BACKEND / "data/processed/climate",
                BACKEND / "data/processed/siap/agricultural_climate_panel.csv",
            ),
            ensure_ascii=False,
        )
    )
