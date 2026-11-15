"""Versioned descriptive report; refuse to train with unverified input provenance."""

import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path

import pandas as pd

from app.analysis.agricultural.exploration import annual

BACKEND = Path(__file__).resolve().parents[2]


def run(panel_path: Path, output_root: Path, siap_manifest: Path, climate_manifest: Path) -> Path:
    """Never overwrite a past run or treat unknown provenance as a forecast target."""
    raw = panel_path.read_bytes()
    panel = pd.read_csv(panel_path)
    siap = json.loads(siap_manifest.read_text(encoding="utf-8"))
    climate = json.loads(climate_manifest.read_text(encoding="utf-8"))
    if not siap.get("sha256") or not climate.get("siap_sha256"):
        raise ValueError("Missing upstream provenance hashes")
    data = annual(panel)
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%S%fZ")
    destination = output_root / stamp
    destination.mkdir(parents=True, exist_ok=False)
    data.to_csv(destination / "annual_price_analysis.csv", index=False, lineterminator="\n")
    grouped = []
    for (region, crop), group in data.groupby(["region_id", "crop_name"]):
        grouped.append(
            {
                "region_id": region,
                "crop_name": crop,
                "rows": len(group),
                "pmr_rows": int((group.price_status == "official_pmr").sum()),
                "workbook_price_unverified_rows": int(
                    (group.price_status == "workbook_price_unverified").sum()
                ),
                "status": "blocked_integrity",
                "forecast_allowed": False,
                "reasons": [
                    "unverified price units and workbook provenance",
                    "official deflator not validated",
                    "publication dates and vintage unavailable",
                ],
            }
        )
    eligibility = {
        "status": "blocked_integrity",
        "training_executed": False,
        "minimum_policy_proposed_not_validated": {
            "group_history_years": 10,
            "minimum_temporal_folds": 3,
            "benchmark_models": ["persistence", "drift"],
            "temporal_split": "expanding whole year",
        },
        "groups": grouped,
    }
    metadata = {
        "panel_sha256": hashlib.sha256(raw).hexdigest(),
        "siap_manifest_sha256": hashlib.sha256(siap_manifest.read_bytes()).hexdigest(),
        "climate_manifest_sha256": hashlib.sha256(climate_manifest.read_bytes()).hexdigest(),
        "deflator": {
            "status": "unavailable_unverified",
            "candidate": "INEGI INPP appropriate agricultural class; INPC sensitivity only",
            "base_year": None,
            "frequency": "monthly; annual aggregation unresolved",
        },
        "predictors": {
            "prices": "raw units unverified; source fields separated",
            "production": "annual SIAP, publication date unknown; lag only after validation",
            "climate": "POWER daily aggregated by approximate agricultural cycle, window may extend beyond label year; availability must be enforced",
            "scenario_labels": "retrospective future leakage; prohibited for model input",
        },
    }
    for name, obj in (("model_eligibility.json", eligibility), ("feature_metadata.json", metadata)):
        (destination / name).write_text(
            json.dumps(obj, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8"
        )
    (destination / "model_report.md").write_text(
        "# HaiLex — análisis descriptivo bloqueado para modelado\n\n"
        f"Registros: {len(data)}. El panel y sus fuentes se identifican por hash en feature_metadata.json.\n\n"
        "No se entrenaron modelos ni se calcularon métricas o intervalos: unidades, procedencia, "
        "deflactor oficial y disponibilidad histórica no están verificados. `official_pmr` identifica "
        "el nombre del campo, no certifica su procedencia. No fusionar con `Precio`.\n\n"
        "La variación anual solo se calcula entre años consecutivos con la misma procedencia. "
        "La serie real se deja vacía; no se extrapola inflación. Los años 2015–2020 no se imputan.\n\n"
        "El clima es de referencia municipal, no parcela; ventanas aproximadas. Correlación no implica causalidad. "
        "Los terciles retrospectivos no son pronósticos y no son admisibles como predictores sin rehacerlos por corte temporal.\n",
        encoding="utf-8",
    )
    return destination


if __name__ == "__main__":
    result = run(
        BACKEND / "data/processed/siap/agricultural_climate_panel.csv",
        BACKEND / "data/processed/modeling",
        BACKEND / "data/processed/siap/source_manifest.json",
        BACKEND / "data/processed/climate/climate_source_manifest.json",
    )
    print(f"Descriptive output: {result}; training blocked")
