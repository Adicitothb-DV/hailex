from uuid import UUID


def test_health_contract(api_request):
    response = api_request("GET", "/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {
        "data": {
            "status": "ok",
            "service": "hailex-api",
            "version": "0.1.0",
            "contract_version": "1.0.0",
        },
        "warnings": [],
    }
    UUID(response.headers["X-Request-ID"])


def test_openapi_and_swagger(api_request):
    schema = api_request("GET", "/openapi.json").json()
    assert set(schema["paths"]) == {"/api/v1/health", "/api/v1/climate/series", "/api/v1/sources"}
    assert "get" in schema["paths"]["/api/v1/health"]
    assert api_request("GET", "/docs").status_code == 200


def test_old_alias_is_not_implemented(api_request):
    assert api_request("GET", "/health").status_code == 404


def test_request_id_is_unique_and_not_trusted(api_request):
    first = api_request("GET", "/api/v1/health", headers={"X-Request-ID": "caller-value"})
    second = api_request("GET", "/api/v1/health")
    assert first.headers["X-Request-ID"] != "caller-value"
    assert first.headers["X-Request-ID"] != second.headers["X-Request-ID"]
