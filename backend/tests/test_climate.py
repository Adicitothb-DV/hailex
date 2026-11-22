import asyncio
import math
from datetime import date

import httpx
import pytest

from app.core.config import Settings
from app.services.climate import ClimateService
from app.services.normalizer import normalize
from app.services.power import PowerClient, PowerError

START = date(2025, 1, 1)
END = date(2025, 1, 2)
URL = "https://power.larc.nasa.gov/api/temporal/daily/point"


def sample():
    return {
        "geometry": {"type": "Point", "coordinates": [-100, 20]},
        "header": {
            "time_standard": "UTC",
            "fill_value": -999,
            "start": "20250101",
            "end": "20250102",
            "api": {"version": "test"},
        },
        "parameters": {
            "T2M": {"units": "C"},
            "PRECTOTCORR": {"units": "mm/day"},
            "ALLSKY_SFC_SW_DWN": {"units": "MJ/m^2/day"},
        },
        "properties": {
            "parameter": {
                "T2M": {"20250102": -2, "20250101": 0},
                "PRECTOTCORR": {"20250101": -999, "20250102": 0},
                "ALLSKY_SFC_SW_DWN": {"20250101": 1, "20250102": 2},
            }
        },
    }


def run(coro):
    return asyncio.run(coro)


def client(handler):
    return PowerClient(URL, 2, httpx.MockTransport(handler))


def test_client_valid_and_query():
    def handle(request):
        assert request.url.params["community"] == "AG"
        assert request.url.params["time-standard"] == "UTC"
        assert request.url.params["start"] == "20250101"
        return httpx.Response(200, json=sample())

    assert run(client(handle).fetch(20, -100, START, END)) == sample()


@pytest.mark.parametrize(
    "kind,code,status",
    [
        ("http", "NASA_RESPONSE_ERROR", 502),
        ("timeout", "NASA_TIMEOUT", 504),
        ("connection", "NASA_RESPONSE_ERROR", 502),
        ("json", "NASA_RESPONSE_ERROR", 502),
        ("duplicate", "NASA_RESPONSE_ERROR", 502),
        ("rate", "SERVICE_UNAVAILABLE", 503),
    ],
)
def test_client_errors(kind, code, status):
    def handle(request):
        if kind == "timeout":
            raise httpx.ReadTimeout("sensitive", request=request)
        if kind == "connection":
            raise httpx.ConnectError("sensitive", request=request)
        if kind == "http":
            return httpx.Response(500)
        if kind == "rate":
            return httpx.Response(429)
        return httpx.Response(200, content=b'{"x":1,"x":2}' if kind == "duplicate" else b"invalid")

    with pytest.raises(PowerError) as error:
        run(client(handle).fetch(20, -100, START, END))
    assert (error.value.code, error.value.status) == (code, status)


def test_normalizer_zero_sentinel_negative_and_order():
    series, variables, warnings = normalize(sample(), START, END)
    assert [p.date for p in series] == [START, END]
    assert series[0].T2M == 0 and series[1].T2M == -2
    assert series[0].PRECTOTCORR is None and series[1].PRECTOTCORR == 0
    assert (variables[1].valid_count, variables[1].missing_count) == (1, 1)
    assert warnings


@pytest.mark.parametrize("value", [float("nan"), float("inf"), -float("inf")])
def test_normalizer_nonfinite_becomes_null(value):
    payload = sample()
    payload["properties"]["parameter"]["T2M"]["20250101"] = value
    series, variables, warnings = normalize(payload, START, END)
    assert series[0].T2M is None and variables[0].missing_count == 1
    assert any("no finitos" in w for w in warnings)


def test_missing_parameter_is_null_with_warning():
    payload = sample()
    del payload["properties"]["parameter"]["T2M"]
    series, variables, warnings = normalize(payload, START, END)
    assert all(p.T2M is None for p in series)
    assert variables[0].missing_count == 2 and any("T2M" in w for w in warnings)


@pytest.mark.parametrize("change", ["structure", "unit", "range", "bad_type", "period"])
def test_bad_payload_rejected(change):
    payload = sample()
    if change == "structure":
        payload["properties"] = {}
    elif change == "unit":
        payload["parameters"]["T2M"]["units"] = "unknown"
    elif change == "range":
        payload["properties"]["parameter"]["T2M"]["20250103"] = 4
    elif change == "bad_type":
        payload["properties"]["parameter"]["T2M"]["20250101"] = True
    else:
        payload["header"]["end"] = "20250103"
    with pytest.raises(PowerError):
        normalize(payload, START, END)


def test_endpoint_and_sources(app, api_request):
    calls = []

    def handler(request):
        calls.append(request)
        payload = sample()
        payload["geometry"]["coordinates"] = [
            float(request.url.params["longitude"]),
            float(request.url.params["latitude"]),
        ]
        return httpx.Response(200, json=payload)

    app.state.climate_service.client = client(handler)
    query = "?latitude=20&longitude=-100&start_date=2025-01-01&end_date=2025-01-02"
    first = api_request("GET", "/api/v1/climate/series" + query)
    second = api_request("GET", "/api/v1/climate/series" + query)
    assert first.status_code == second.status_code == 200
    assert first.json()["data"]["retrieval"]["retrieval_mode"] == "upstream"
    assert second.json()["data"]["retrieval"]["retrieval_mode"] == "cache"
    assert first.json()["data"]["snapshot_id"] != second.json()["data"]["snapshot_id"]
    assert (
        first.json()["data"]["retrieval"]["retrieved_at"]
        == second.json()["data"]["retrieval"]["retrieved_at"]
    )
    assert len(calls) == 1
    source = api_request("GET", "/api/v1/sources").json()["data"]["sources"][0]
    assert source["status"] == "implemented" and len(source["parameters"]) == 3
    assert len(calls) == 1


@pytest.mark.parametrize(
    "query",
    [
        "latitude=91&longitude=0&start_date=2025-01-01&end_date=2025-01-02",
        "latitude=NaN&longitude=0&start_date=2025-01-01&end_date=2025-01-02",
        "latitude=0&longitude=181&start_date=2025-01-01&end_date=2025-01-02",
        "latitude=0&longitude=0&start_date=2025-02-30&end_date=2025-03-01",
        "latitude=0&longitude=0&start_date=2025-01-02&end_date=2025-01-01",
        "latitude=0&longitude=0&start_date=2024-01-01&end_date=2025-01-01",
        "latitude=0&longitude=0&start_date=2025-01-01&end_date=2099-01-01",
        "latitude=0&longitude=0&start_date=2025-01-01&end_date=2025-01-02&extra=x",
    ],
)
def test_validation(api_request, query):
    response = api_request("GET", "/api/v1/climate/series?" + query)
    assert response.status_code == 422 and response.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.parametrize(
    "timeout,status,code", [(False, 502, "NASA_RESPONSE_ERROR"), (True, 504, "NASA_TIMEOUT")]
)
def test_endpoint_errors(app, api_request, timeout, status, code):
    def handler(request):
        if timeout:
            raise httpx.ReadTimeout("sensitive", request=request)
        return httpx.Response(500)

    app.state.climate_service.client = client(handler)
    response = api_request(
        "GET",
        "/api/v1/climate/series?latitude=20&longitude=-100&start_date=2025-01-01&end_date=2025-01-02",
    )
    assert response.status_code == status and response.json()["error"]["code"] == code
    assert "sensitive" not in response.text


def test_concurrency_cache_snapshot_expiry_and_clear(monkeypatch):
    calls = []

    def handler(request):
        calls.append(request)
        payload = sample()
        payload["geometry"]["coordinates"] = [
            float(request.url.params["longitude"]),
            float(request.url.params["latitude"]),
        ]
        return httpx.Response(200, json=payload)

    service = ClimateService(Settings(_env_file=None), client(handler))

    async def exercise():
        return await asyncio.gather(*(service.query(20, -100, START, END) for _ in range(5)))

    results = run(exercise())
    assert len(calls) == 1 and len({r[0].snapshot_id for r in results}) == 5
    run(service.query(21, -100, START, END))
    assert len(calls) == 2
    snapshot = results[0][0]
    retrieved = service.get_snapshot(snapshot.snapshot_id)
    retrieved.series[0].T2M = 44
    assert service.get_snapshot(snapshot.snapshot_id).series[0].T2M == 0
    monkeypatch.setattr("app.services.climate.time.monotonic", lambda: math.inf)
    with pytest.raises(PowerError, match="CLIMATE_SNAPSHOT_EXPIRED"):
        service.get_snapshot(snapshot.snapshot_id)
    service.clear()
    with pytest.raises(PowerError, match="CLIMATE_SNAPSHOT_EXPIRED"):
        service.get_snapshot("missing")


def test_cache_expiry_issues_new_request(monkeypatch):
    ticks = [100.0]
    monkeypatch.setattr("app.services.climate.time.monotonic", lambda: ticks[0])
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(200, json=sample())

    service = ClimateService(Settings(_env_file=None, climate_cache_ttl_seconds=5), client(handler))
    first = run(service.query(20, -100, START, END))[0]
    ticks[0] += 5
    second = run(service.query(20, -100, START, END))[0]
    assert len(calls) == 2 and second.retrieval.retrieval_mode == "upstream"
    assert service.get_snapshot(first.snapshot_id).snapshot_id == first.snapshot_id


def test_historical_fallback_does_not_mix_regions():
    def handler(request):
        raise httpx.ReadTimeout("down", request=request)

    service = ClimateService(Settings(_env_file=None), client(handler))
    a = run(service.query(20.60656972, -100.33109667, START, date(2025, 12, 31)))[0]
    b = run(service.query(20.78832639, -100.04543056, START, date(2025, 12, 31)))[0]
    assert a.retrieval.retrieval_mode == b.retrieval.retrieval_mode == "historical_fixture"
    assert a.retrieval.retrieved_at != b.retrieval.retrieved_at
    assert a.series != b.series and a.location != b.location
    with pytest.raises(PowerError, match="NASA_TIMEOUT"):
        run(service.query(20.60656972, -100.33109667, START, END))
