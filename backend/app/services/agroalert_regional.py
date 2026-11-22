"""Independent POWER regional grid helper; never used as municipal parcel data."""

import math
from datetime import date, datetime, timedelta
from io import StringIO

import pandas as pd

from app.analysis.agroalert_indicators import clean_value
from app.services.agroalert_power import NASADataError, SoilPowerClient

ALLOWED = {"SFMC", "RZMC", "GWETTOP", "GWETROOT", "SFMC_PRCNTL", "RZMC_PRCNTL"}


def normalize_bounds(lat_min: float, lat_max: float, lon_min: float, lon_max: float) -> tuple:
    if not all(math.isfinite(v) for v in (lat_min, lat_max, lon_min, lon_max)):
        raise ValueError("Coordenadas inválidas")
    if not (-90 <= lat_min <= lat_max <= 90 and -180 <= lon_min <= lon_max <= 180):
        raise ValueError("Coordenadas inválidas")
    if lat_max - lat_min > 10 or lon_max - lon_min > 10:
        raise ValueError("Área regional mayor al máximo de 10 grados")

    def expand(low: float, high: float, limit: float) -> tuple[float, float]:
        if high - low >= 2.05:
            return round(low, 4), round(high, 4)
        center = (low + high) / 2
        start = max(-limit, min(center - 1.025, limit - 2.05))
        return round(start, 4), round(start + 2.05, 4)

    return (*expand(lat_min, lat_max, 90), *expand(lon_min, lon_max, 180))


def parse_regional_csv(text: str, parameter: str) -> list[dict]:
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if line.strip().upper() == "-END HEADER-":
            lines = lines[index + 1 :]
            break
    else:
        for index, line in enumerate(lines):
            columns = {col.strip().upper().replace(" ", "_") for col in line.split(",")}
            if columns & {"LAT", "LATITUDE", "LATITUDE_DEG"} and columns & {
                "LON",
                "LONGITUDE",
                "LONGITUDE_DEG",
            }:
                lines = lines[index:]
                break
    try:
        frame = pd.read_csv(StringIO("\n".join(lines)), comment="#", skipinitialspace=True)
        frame.columns = [str(col).strip().upper().replace(" ", "_") for col in frame.columns]
        frame = frame.rename(
            columns={
                "LATITUDE": "LAT",
                "LATITUDE_DEG": "LAT",
                "LONGITUDE": "LON",
                "LONGITUDE_DEG": "LON",
            }
        )
        value_column = next(
            col for col in frame.columns if col == parameter or col.endswith(parameter)
        )
        rows = []
        for row in frame.to_dict("records"):
            lat, lon, value = (clean_value(row.get(key)) for key in ("LAT", "LON", value_column))
            if (
                lat is None
                or lon is None
                or value is None
                or not (-90 <= lat <= 90 and -180 <= lon <= 180)
            ):
                continue
            day = None
            try:
                if pd.notna(row.get("DATE")):
                    day = pd.to_datetime(str(row["DATE"]), errors="coerce")
                    day = None if pd.isna(day) else day.date().isoformat()
                elif all(pd.notna(row.get(k)) for k in ("YEAR", "MO", "DY")):
                    day = date(int(row["YEAR"]), int(row["MO"]), int(row["DY"])).isoformat()
                elif all(pd.notna(row.get(k)) for k in ("YEAR", "DOY")):
                    year, doy = int(row["YEAR"]), int(row["DOY"])
                    parsed = datetime(year, 1, 1) + timedelta(days=doy - 1)
                    day = parsed.date().isoformat() if doy >= 1 and parsed.year == year else None
            except (TypeError, ValueError, OverflowError):
                pass
            rows.append({"date": day, "lat": lat, "lon": lon, parameter: value})
    except (ValueError, KeyError, StopIteration, pd.errors.ParserError) as exc:
        raise NASADataError() from exc
    if not rows:
        raise NASADataError()
    return sorted(rows, key=lambda row: row["date"] or "")


async def regional_grid(
    client: SoilPowerClient, bounds: tuple, parameter: str, start: date, end: date
) -> dict:
    if parameter not in ALLOWED:
        raise ValueError("Parámetro regional no admitido")
    lat_min, lat_max, lon_min, lon_max = normalize_bounds(*bounds)
    raw = parameter.removesuffix("_PRCNTL")
    fallback = {"SFMC": "GWETTOP", "RZMC": "GWETROOT"}

    async def fetch(variable: str) -> list[dict]:
        response = await client.request(
            "regional",
            {
                "latitude-min": lat_min,
                "latitude-max": lat_max,
                "longitude-min": lon_min,
                "longitude-max": lon_max,
                "parameters": variable,
                "community": "AG",
                "start": start.strftime("%Y%m%d"),
                "end": end.strftime("%Y%m%d"),
                "format": "CSV",
                "time-standard": "UTC",
            },
        )
        return parse_regional_csv(response.text, variable)

    used_fallback = False
    try:
        rows = await fetch(raw)
    except NASADataError:
        if raw not in fallback:
            raise
        raw = fallback[raw]
        rows = await fetch(raw)
        used_fallback = True
    if parameter.endswith("_PRCNTL"):
        ranks = pd.Series([row[raw] for row in rows]).rank(method="average", pct=True) * 100
        for row, rank in zip(rows, ranks, strict=True):
            row[parameter] = round(float(rank), 1)
            del row[raw]
        resolved, unit = parameter, "%"
    else:
        resolved, unit = raw, "m³/m³" if raw in {"SFMC", "RZMC"} else "índice (0–1)"
    return {
        "rows": rows,
        "resolved_parameter": resolved,
        "unit": unit,
        "used_merra_fallback": used_fallback,
        "bounds": [lat_min, lat_max, lon_min, lon_max],
    }
