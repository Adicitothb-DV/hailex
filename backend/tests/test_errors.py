import logging

from fastapi import HTTPException, Request
from pydantic import BaseModel

from app.core.logging import AccessLogFilter


def assert_error(response, status, code):
    assert response.status_code == status
    payload = response.json()
    assert set(payload) == {"error"}
    error = payload["error"]
    assert set(error) == {"code", "message", "request_id", "fields"}
    assert error["code"] == code
    assert error["request_id"] == response.headers["X-Request-ID"]
    assert isinstance(error["fields"], list)
    return error


def test_not_found_and_method(api_request):
    assert_error(api_request("GET", "/missing"), 404, "NOT_FOUND")
    response = api_request("POST", "/api/v1/health")
    assert_error(response, 405, "METHOD_NOT_ALLOWED")
    assert "GET" in response.headers["Allow"]


def test_validation_is_safe(app, api_request):
    @app.get("/test-only/validation")
    async def validate(count: int):
        return {"count": count}

    response = api_request("GET", "/test-only/validation?count=private-value")
    error = assert_error(response, 422, "VALIDATION_ERROR")
    assert error["fields"] == [{"field": "query.count", "message": "Valor inválido."}]
    assert "private-value" not in response.text


def test_invalid_json(app, api_request):
    class Body(BaseModel):
        count: int

    @app.post("/test-only/body")
    async def body(value: Body):
        return value

    response = api_request(
        "POST", "/test-only/body", content="{", headers={"Content-Type": "application/json"}
    )
    assert_error(response, 400, "INVALID_JSON")


def test_http_details_not_exposed(app, api_request):
    @app.get("/test-only/http")
    async def fail():
        raise HTTPException(403, detail="secret-token")

    response = api_request("GET", "/test-only/http")
    assert_error(response, 403, "FORBIDDEN")
    assert "secret-token" not in response.text


def test_internal_error_and_logs_are_safe(app, api_request, caplog):
    @app.get("/test-only/failure")
    async def fail():
        raise RuntimeError("secret-token")

    with caplog.at_level(logging.INFO, logger="hailex"):
        response = api_request(
            "GET",
            "/test-only/failure?api_key=private-query",
            headers={"Origin": "http://localhost:5173", "Authorization": "private-header"},
        )
    assert_error(response, 500, "INTERNAL_ERROR")
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
    for private in ("secret-token", "private-query", "private-header", "Traceback"):
        assert private not in response.text
        assert private not in caplog.text
    assert all(
        record.request_id == response.headers["X-Request-ID"]
        for record in caplog.records
        if record.name == "hailex"
    )
    assert "RuntimeError" in caplog.text


def test_request_id_available_in_request_state(app, api_request):
    @app.get("/test-only/context")
    async def context(incoming: Request):
        return {"request_id": incoming.state.request_id}

    response = api_request("GET", "/test-only/context")
    assert response.json()["request_id"] == response.headers["X-Request-ID"]


def test_uvicorn_access_log_does_not_include_query_values():
    record = logging.LogRecord(
        "uvicorn.access",
        logging.INFO,
        __file__,
        1,
        '%s - "%s %s HTTP/%s" %d',
        ("localhost", "GET", "/missing?api_key=private-value", "1.1", 404),
        None,
    )
    assert AccessLogFilter().filter(record)
    assert "private-value" not in record.getMessage()
    assert "<redacted>" in record.getMessage()
