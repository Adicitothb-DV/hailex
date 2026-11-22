"""Read and validate the supplied SIAP-derived workbook without changing it."""

from functools import lru_cache
from pathlib import Path

import pandas as pd

from scripts.data_pipeline.load_siap import load_workbook
from scripts.data_pipeline.normalize_siap import normalize
from scripts.data_pipeline.validate_siap import validate

SOURCE = (
    Path(__file__).resolve().parents[2] / "data/raw/siap/Consolidado_El_Marques_Colon_Cultivos.xlsx"
)


@lru_cache(maxsize=1)
def read_source(mtime: float) -> tuple:
    del mtime
    raw, digest = load_workbook(SOURCE)
    rows, quality = validate(normalize(raw))
    return rows[rows["quality_status"] != "rejected"], quality, digest


def records(
    region: str | None = None,
    crop: str | None = None,
    cycle: str | None = None,
    mode: str | None = None,
) -> dict:
    if not SOURCE.is_file():
        return {"status": "source_file_missing", "records": [], "coverage": None}
    rows, quality, digest = read_source(SOURCE.stat().st_mtime)
    for column, value in (
        ("region_id", region),
        ("crop_name", crop),
        ("agricultural_cycle", cycle),
        ("irrigation_mode", mode),
    ):
        if value:
            rows = rows[rows[column] == value]
    result = []

    def number(row, column):
        value = row[column]
        return None if pd.isna(value) else float(value)

    for _, row in rows.iterrows():
        result.append(
            {
                "year": int(row["year"]),
                "region": row["region_id"],
                "municipality": row["municipality_name"],
                "crop": row["crop_name"],
                "crop_original": row["crop_name_raw"],
                "cycle": row["agricultural_cycle"],
                "mode": row["irrigation_mode"],
                "unit": row["Nomunidad"],
                "planted": number(row, "planted_area"),
                "harvested": number(row, "harvested_area"),
                "damaged": number(row, "damaged_area"),
                "volume": number(row, "production_volume"),
                "yield_reported": number(row, "reported_yield"),
                "production_value": number(row, "production_value"),
                "pmr_reported_unverified": number(row, "rural_average_price"),
                "workbook_price_unverified": number(row, "Precio_numeric"),
                "derived_value_per_volume": number(row, "price_from_value_volume"),
                "quality_status": row["quality_status"],
            }
        )
    return {
        "status": "success" if result else "empty",
        "records": result,
        "coverage": {
            "years_present": quality["years_present"],
            "years_missing": quality["years_missing_within_range"],
            "total_rows": quality["total_rows"],
            "sha256": digest,
        },
        "forecast_status": "forecast_not_reliable",
        "source": "Libro consolidado proporcionado por el equipo, procedencia SIAP original no verificada",
        "price_warning": "Preciomediorural y Precio son columnas separadas; diccionario y unidades monetarias no verificados. Cociente derivado solo para volumen positivo.",
    }
