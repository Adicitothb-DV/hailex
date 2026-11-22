"""The NASA client uses mock transport: these tests do not simulate production data."""

import asyncio
from datetime import date

import httpx
import pytest

from app.services.agroalert_power import NASADataError, SoilPowerClient, parse_point


def test_parser_removes_missing_and_invalid_dates():
    payload = {
        "properties": {"parameter": {"SFMC": {"20260101": -999, "x": 1}, "RZMC": {"20260102": 0.4}}}
    }
    assert parse_point(payload, ("SFMC", "RZMC")) == [
        {"date": "2026-01-01", "SFMC": None, "RZMC": None},
        {"date": "2026-01-02", "SFMC": None, "RZMC": 0.4},
    ]
    with pytest.raises(NASADataError):
        parse_point({}, ("SFMC",))


def test_422_retries_with_merra_and_keeps_unit():
    requests = []

    def handler(request):
        requests.append(request)
        if len(requests) == 1:
            return httpx.Response(422)
        return httpx.Response(
            200,
            json={
                "properties": {
                    "parameter": {"GWETTOP": {"20260101": 0.4}, "GWETROOT": {"20260101": 0.5}}
                }
            },
        )

    async def run():
        client = SoilPowerClient(httpx.MockTransport(handler))
        return await client.point_series(20.7, -100.2, date(2026, 1, 1), date(2026, 1, 1))

    result = asyncio.run(run())
    assert result["source_model"] == "MERRA-2 (NASA POWER)"
    assert result["unit"] == "índice (0–1)"
    assert result["rows"][0]["SFMC"] is None
    assert requests[0].url.params["community"] == "AG"
    assert requests[0].url.params["time-standard"] == "UTC"
    assert requests[0].url.params["start"] == "20250102"
    assert requests[1].url.params["parameters"] == "GWETTOP,GWETROOT"


def test_smap_priority_and_empty_visible_period():
    def handler(request):
        return httpx.Response(
            200,
            json={
                "properties": {
                    "parameter": {"SFMC": {"20260101": 0.2}, "GWETTOP": {"20260101": 0.9}}
                }
            },
        )

    async def run():
        client = SoilPowerClient(httpx.MockTransport(handler))
        first = await client.point_series(20, -100, date(2026, 1, 1), date(2026, 1, 1))
        empty = await client.point_series(20, -100, date(2026, 1, 2), date(2026, 1, 2))
        return first, empty

    first, empty = asyncio.run(run())
    assert first["source_model"] == "SMAP L4 (NASA POWER)"
    assert first["unit"] == "m³/m³"
    assert first["rows"][0]["GWETTOP"] is None
    assert empty["rows"] == []


def test_transient_failures_are_retried(monkeypatch):
    calls = []
    waits = []

    async def sleep(delay):
        waits.append(delay)

    def handler(request):
        calls.append(request)
        return httpx.Response(503 if len(calls) < 3 else 200, json={})

    monkeypatch.setattr("app.services.agroalert_power.asyncio.sleep", sleep)
    asyncio.run(SoilPowerClient(httpx.MockTransport(handler)).request("point", {}))
    assert len(calls) == 3
    assert waits == [1.5, 3.0]
