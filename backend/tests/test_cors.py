import pytest


@pytest.mark.parametrize("origin", ["http://localhost:5173", "http://127.0.0.1:5173"])
def test_allowed_origin_and_preflight(api_request, origin):
    response = api_request("GET", "/api/v1/health", headers={"Origin": origin})
    assert response.headers["Access-Control-Allow-Origin"] == origin
    assert "X-Request-ID" in response.headers["Access-Control-Expose-Headers"]
    response = api_request(
        "OPTIONS",
        "/api/v1/health",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers["Access-Control-Allow-Origin"] == origin
    assert "Access-Control-Allow-Credentials" not in response.headers
    assert response.headers["X-Request-ID"]


def test_arbitrary_origin_is_not_authorized(api_request):
    response = api_request("GET", "/api/v1/health", headers={"Origin": "https://untrusted.invalid"})
    assert "Access-Control-Allow-Origin" not in response.headers
    response = api_request(
        "OPTIONS",
        "/api/v1/health",
        headers={"Origin": "https://untrusted.invalid", "Access-Control-Request-Method": "GET"},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_REQUEST"
    assert response.json()["error"]["request_id"] == response.headers["X-Request-ID"]
    assert "Access-Control-Allow-Origin" not in response.headers


@pytest.mark.parametrize(
    "header,value",
    [("Access-Control-Request-Method", "DELETE"), ("Access-Control-Request-Headers", "X-Secret")],
)
def test_unapproved_method_or_header(api_request, header, value):
    headers = {"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"}
    headers[header] = value
    assert api_request("OPTIONS", "/api/v1/health", headers=headers).status_code == 400
