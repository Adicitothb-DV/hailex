"""Normalize daily POWER observations without inventing or interpolating values."""

import math
from datetime import date, timedelta

from app.schemas.climate import ClimatePoint, Variable
from app.services.power import PARAMETERS, PowerError

NORMALIZER_VERSION = "1.0.0"
SOURCE_ID = "nasa-power-daily"
METADATA = {
    "T2M": ("C", "0.5° latitude × 0.625° longitude", "model"),
    "PRECTOTCORR": ("mm/day", "0.5° latitude × 0.625° longitude", "model"),
    "ALLSKY_SFC_SW_DWN": ("MJ/m^2/day", "1° latitude × 1° longitude", "estimate"),
}
DESCRIPTIONS = {
    "T2M": "Temperature at 2 Meters",
    "PRECTOTCORR": "Precipitation Corrected",
    "ALLSKY_SFC_SW_DWN": "All Sky Surface Shortwave Downward Irradiance",
}


def normalize(
    payload: dict, start: date, end: date
) -> tuple[list[ClimatePoint], list[Variable], list[str]]:
    try:
        header = payload["header"]
        data = payload["properties"]["parameter"]
        metadata = payload["parameters"]
        if (
            not isinstance(header, dict)
            or not isinstance(data, dict)
            or not isinstance(metadata, dict)
        ):
            raise ValueError("Invalid structure")
        api = header.get("api")
        if not isinstance(api, dict) or not isinstance(api.get("version"), str):
            raise ValueError("Missing provider version")
        if header.get("time_standard") != "UTC":
            raise ValueError("Wrong time standard")
        if header.get("start") != start.strftime("%Y%m%d") or header.get("end") != end.strftime(
            "%Y%m%d"
        ):
            raise ValueError("Provider period differs from request")
        sentinel = header.get("fill_value")
        if (
            isinstance(sentinel, bool)
            or not isinstance(sentinel, (int, float))
            or not math.isfinite(sentinel)
        ):
            raise ValueError("Missing fill value")
        if not data or not any(key in data for key in PARAMETERS):
            raise ValueError("Missing all parameter series")
        geometry = payload.get("geometry")
        if not isinstance(geometry, dict) or geometry.get("type") != "Point":
            raise ValueError("Missing point geometry")
        coords = geometry.get("coordinates")
        if not isinstance(coords, list) or len(coords) < 2:
            raise ValueError("Invalid coordinates")
        if any(
            isinstance(value, bool)
            or not isinstance(value, (float, int))
            or not math.isfinite(value)
            for value in coords[:2]
        ):
            raise ValueError("Invalid coordinates")
        days = [start + timedelta(days=i) for i in range((end - start).days + 1)]
        normalized: dict[str, dict[date, float | None]] = {}
        variables: list[Variable] = []
        warnings: list[str] = ["Una celda regional no describe con exactitud una parcela."]
        for key in PARAMETERS:
            unit, resolution, kind = METADATA[key]
            raw = data.get(key)
            info = metadata.get(key)
            if raw is None:
                raw = {}
                warnings.append(f"El proveedor no devolvió el parámetro {key}.")
            elif not isinstance(raw, dict):
                raise ValueError("Invalid series")
            if info is not None and (not isinstance(info, dict) or info.get("units") != unit):
                raise ValueError("Unverified unit")
            if info is None and raw:
                raise ValueError("Missing unit metadata")
            values: dict[date, float | None] = {}
            nonfinite = 0
            for key_date, raw_value in raw.items():
                if (
                    not isinstance(key_date, str)
                    or len(key_date) != 8
                    or not key_date.isascii()
                    or not key_date.isdigit()
                ):
                    raise ValueError("Invalid date")
                day = date(int(key_date[:4]), int(key_date[4:6]), int(key_date[6:]))
                if day < start or day > end or day in values:
                    raise ValueError("Date outside request or duplicated")
                if isinstance(raw_value, bool):
                    raise ValueError("Invalid value")
                if raw_value is None or raw_value == sentinel:
                    values[day] = None
                elif not isinstance(raw_value, (int, float)):
                    raise ValueError("Invalid value")
                elif not math.isfinite(raw_value):
                    values[day] = None
                    nonfinite += 1
                else:
                    values[day] = float(raw_value)
            if nonfinite:
                warnings.append(f"{key}: {nonfinite} valores no finitos tratados como ausentes.")
            missing = sum(values.get(day) is None for day in days)
            if missing:
                warnings.append(f"{key}: {missing} valores ausentes en el periodo.")
            normalized[key] = values
            variables.append(
                Variable(
                    id=key,
                    source_id=SOURCE_ID,
                    unit=unit,
                    data_type=kind,
                    spatial_resolution=resolution,
                    temporal_resolution="daily",
                    valid_count=len(days) - missing,
                    missing_count=missing,
                    limitations=[
                        f"NASA: {DESCRIPTIONS[key]}.",
                        "Estimación o modelo regional, no medición de parcela; el producto puede variar con la fecha.",
                    ],
                )
            )
        series = [
            ClimatePoint(date=day, **{key: normalized[key].get(day) for key in PARAMETERS})
            for day in days
        ]
        return series, variables, warnings
    except (KeyError, TypeError, ValueError, OverflowError) as exc:
        raise PowerError("NASA_RESPONSE_ERROR", 502) from exc
