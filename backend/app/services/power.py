"""NASA POWER HTTP transport, with sanitised exceptions and strict JSON parsing."""

import json
import logging
from datetime import date

import httpx

PARAMETERS = ("T2M", "PRECTOTCORR", "ALLSKY_SFC_SW_DWN")
COMMUNITY = "AG"
TIME_STANDARD = "UTC"
LOGGER = logging.getLogger(__name__)


class PowerError(Exception):
    def __init__(self, code: str, status: int) -> None:
        self.code = code
        self.status = status
        super().__init__(code)


def _pairs(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON key")
        result[key] = value
    return result


def _invalid_constant(value: str) -> object:
    raise ValueError("Invalid JSON constant")


class PowerClient:
    def __init__(self, url: str, timeout: float, transport: httpx.AsyncBaseTransport | None = None):
        self.url = url
        self.timeout = timeout
        self.transport = transport

    async def fetch(self, latitude: float, longitude: float, start: date, end: date) -> dict:
        query = {
            "parameters": ",".join(PARAMETERS),
            "community": COMMUNITY,
            "time-standard": TIME_STANDARD,
            "format": "JSON",
            "latitude": latitude,
            "longitude": longitude,
            "start": start.strftime("%Y%m%d"),
            "end": end.strftime("%Y%m%d"),
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout, transport=self.transport) as client:
                response = await client.get(self.url, params=query)
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            LOGGER.warning("NASA POWER timeout")
            raise PowerError("NASA_TIMEOUT", 504) from exc
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code
            LOGGER.warning("NASA POWER HTTP status=%s", status)
            raise PowerError(
                "SERVICE_UNAVAILABLE" if status == 429 else "NASA_RESPONSE_ERROR",
                503 if status == 429 else 502,
            ) from exc
        except httpx.RequestError as exc:
            LOGGER.warning("NASA POWER connection error type=%s", type(exc).__name__)
            raise PowerError("NASA_RESPONSE_ERROR", 502) from exc
        try:
            data = json.loads(
                response.content, parse_constant=_invalid_constant, object_pairs_hook=_pairs
            )
            if not isinstance(data, dict):
                raise ValueError("JSON root not object")
            return data
        except (ValueError, UnicodeDecodeError) as exc:
            LOGGER.warning("NASA POWER invalid JSON")
            raise PowerError("NASA_RESPONSE_ERROR", 502) from exc
