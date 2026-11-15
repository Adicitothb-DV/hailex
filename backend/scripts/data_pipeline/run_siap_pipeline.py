"""Run offline: python -m scripts.data_pipeline.run_siap_pipeline from backend."""

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path

from .aggregate_siap import aggregate
from .load_siap import SHEET, load_workbook
from .normalize_siap import normalize
from .validate_siap import validate

BACKEND = Path(__file__).resolve().parents[2]
VERSION = "1.0.0"


def run(source: Path, output: Path) -> dict:
    source, output = source.resolve(), output.resolve()
    if source == output or output in source.parents:
        raise ValueError("Output directory cannot contain the source workbook")
    raw, digest = load_workbook(source)
    observations, report = validate(normalize(raw))
    summary = aggregate(observations, collapse_cycles=False)
    prices = aggregate(observations, collapse_cycles=True)
    manifest = {
        "pipeline_version": VERSION,
        "source_file": source.name,
        "source_sheet": SHEET,
        "sha256": digest,
        "source_description": "SIAP-derived workbook supplied by team; original CSV provenance unverified",
        "siap_reference": "https://nube.agricultura.gob.mx/datosAbiertos/Agricola.php",
        "processed_at_utc": datetime.now(UTC).isoformat(),
        "rules": [
            "raw columns preserved",
            "original workbook immutable",
            "price equals value divided by positive volume",
            "summary does not average unit prices",
            "suppress aggregates with invalid rows or incompatible units",
        ],
        "warnings": [
            "official dictionary and price/value units not verified",
            "Precio provenance unverified",
            "collapsed cycle and irrigation aggregates are provisional",
            "no missing years interpolated",
        ],
    }
    output.mkdir(parents=True, exist_ok=True)
    observations.to_csv(output / "agricultural_observations.csv", index=False, lineterminator="\n")
    summary.to_csv(output / "annual_crop_summary.csv", index=False, lineterminator="\n")
    prices.to_csv(output / "annual_price_series.csv", index=False, lineterminator="\n")
    for name, data in (("data_quality_report.json", report), ("source_manifest.json", manifest)):
        (output / name).write_text(
            json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8"
        )
    return report


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Normalize the local SIAP workbook without modifying it"
    )
    parser.add_argument(
        "--source",
        type=Path,
        default=BACKEND / "data/raw/siap/Consolidado_El_Marques_Colon_Cultivos.xlsx",
    )
    parser.add_argument("--output", type=Path, default=BACKEND / "data/processed/siap")
    args = parser.parse_args()
    result = run(args.source, args.output)
    print(
        json.dumps(
            {key: result[key] for key in ("total_rows", "accepted", "warnings", "rejected")},
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
