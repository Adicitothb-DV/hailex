"""NASA POWER soil moisture client. All network access is performed server-side."""

import asyncio
import logging
from datetime import date, datetime, timedelta

import httpx

from app.analysis.agroalert_indicators import PARAMETERS, attach_percentiles, clean_value

LOGGER = logging.getLogger(__name__)
BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily"
RETRYABLE = {429, 500, 502, 503, 504}
SMAP = ("SFMC", "RZMC")
MERRA = ("GWETTOP", "GWETROOT")


class NASADataError(Exception):
    def __init__(self, status: int | None = None):
        self.status = status
        super().__init__("NASA POWER no está disponible o no devolvió datos utilizables.")


def parse_point(payload: object, parameters: tuple[str, ...]) -> list[dict]:
    try:
        values = payload["properties"]["parameter"]
        if not isinstance(values, dict):
            raise TypeError
    except (KeyError, TypeError) as exc:
        raise NASADataError() from exc
    dates = {str(day) for series in values.values() if isinstance(series, dict) for day in series}
    rows = []
    for day in sorted(dates):
        try:
            if len(day) != 8 or not day.isascii() or not day.isdigit():
                continue
            parsed = datetime.strptime(day, "%Y%m%d").date().isoformat()
        except ValueError:
            continue
        row = {"date": parsed}
        for parameter in parameters:
            series = values.get(parameter)
            row[parameter] = clean_value(series.get(day)) if isinstance(series, dict) else None
        rows.append(row)
    if not rows:
        raise NASADataError()
    return rows


class SoilPowerClient:
    def __init__(self, transport: httpx.AsyncBaseTransport | None = None):
        self.transport = transport
        self._slots = asyncio.Semaphore(6)

    async def request(self, path: str, params: dict) -> httpx.Response:
        async with self._slots:
            async with httpx.AsyncClient(
                timeout=45, transport=self.transport, headers={"User-Agent": "HaiLex/1.0"}
            ) as client:
                for attempt in range(3):
                    try:
                        response = await client.get(f"{BASE_URL}/{path}", params=params)
                    except httpx.RequestError as exc:
                        if attempt == 2:
                            LOGGER.warning("NASA POWER connection failed: %s", type(exc).__name__)
                            raise NASADataError() from exc
                    else:
                        if response.is_success:
                            return response
                        if response.status_code not in RETRYABLE or attempt == 2:
                            LOGGER.warning("NASA POWER HTTP status %s", response.status_code)
                            raise NASADataError(response.status_code)
                    await asyncio.sleep(1.5 * (attempt + 1))
        raise NASADataError()

    async def point_parameters(
        self, latitude: float, longitude: float, start: date, end: date, parameters: tuple[str, ...]
    ) -> list[dict]:
        response = await self.request(
            "point",
            {
                "parameters": ",".join(parameters),
                "community": "AG",
                "latitude": round(latitude, 4),
                "longitude": round(longitude, 4),
                "start": start.strftime("%Y%m%d"),
                "end": end.strftime("%Y%m%d"),
                "format": "JSON",
                "time-standard": "UTC",
            },
        )
        try:
            payload = response.json()
        except ValueError as exc:
            raise NASADataError() from exc
        return parse_point(payload, parameters)

    async def point_series(self, latitude: float, longitude: float, start: date, end: date) -> dict:
        baseline_start = min(start, end - timedelta(days=364))
        try:
            rows = await self.point_parameters(latitude, longitude, baseline_start, end, PARAMETERS)
        except NASADataError as exc:
            if exc.status != 422:
                raise
            rows = await self.point_parameters(latitude, longitude, baseline_start, end, MERRA)
        window = [row for row in rows if start.isoformat() <= row["date"] <= end.isoformat()]
        has_smap = any(row.get(key) is not None for row in window for key in SMAP)
        has_merra = any(row.get(key) is not None for row in window for key in MERRA)
        if has_smap:
            active, source, unit = SMAP, "SMAP L4 (NASA POWER)", "m³/m³"
        elif has_merra:
            active, source, unit = MERRA, "MERRA-2 (NASA POWER)", "índice (0–1)"
        else:
            active, source, unit = SMAP, "NASA POWER", "m³/m³"
        ranked = attach_percentiles(rows, *active)
        visible = []
        for row in ranked:
            if start.isoformat() <= row["date"] <= end.isoformat():
                for parameter in PARAMETERS:
                    if parameter not in active:
                        row[parameter] = None
                    else:
                        row.setdefault(parameter, None)
                visible.append(row)
        return {
            "rows": visible,
            "source_model": source,
            "unit": unit,
            "active_surface_parameter": active[0],
            "active_root_parameter": active[1],
            "used_merra_fallback": active == MERRA,
            "baseline_start": baseline_start.isoformat(),
        }
