import asyncio
import json
from datetime import UTC

import httpx
import pytest
from pydantic import SecretStr

from app.core.config import Settings
from app.schemas.advisor import AdvisorRequest
from app.services import advisor_context
from app.services.groq_advisor import MODEL, AdvisorError, generate

ANSWER = {
    "conclusion": "Revisar en campo.",
    "interpretation": "No hay diagnóstico.",
    "actions": ["Comprobar agua."],
    "limitations": ["Sin medición local."],
    "follow_up_questions": [],
}


def run(coro):
    return asyncio.run(coro)


def settings():
    return Settings(_env_file=None, groq_api_key=SecretStr("test-secret-not-real"))


def test_missing_key_does_not_collect_data(api_request):
    response = api_request("POST", "/api/v1/advisor/chat", json={"message": "Hola"})
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "groq_api_key_missing"


def test_groq_success_schema_and_context():
    def handler(req):
        assert req.headers["authorization"] == "Bearer test-secret-not-real"
        payload = json.loads(req.content)
        assert payload["model"] == MODEL
        assert payload["response_format"]["type"] == "json_schema"
        assert "tools" not in payload
        assert json.loads(payload["messages"][1]["content"])["evidence"]["test"] == "ok"
        return httpx.Response(
            200,
            json={
                "choices": [{"finish_reason": "stop", "message": {"content": json.dumps(ANSWER)}}]
            },
        )

    answer = run(generate(settings(), "Pregunta", {"test": "ok"}, httpx.MockTransport(handler)))
    assert answer.conclusion == ANSWER["conclusion"]


@pytest.mark.parametrize(
    "status,code",
    [
        (401, "groq_auth_error"),
        (403, "groq_auth_error"),
        (404, "groq_model_unavailable"),
        (429, "groq_rate_limited"),
        (500, "groq_provider_error"),
    ],
)
def test_provider_errors_are_sanitized(status, code):
    def handler(req):
        return httpx.Response(status, text="test-secret-not-real", headers={"retry-after": "12"})

    with pytest.raises(AdvisorError) as exc:
        run(generate(settings(), "Pregunta", {}, httpx.MockTransport(handler)))
    assert exc.value.code == code
    assert "test-secret-not-real" not in str(exc.value)
    if status == 429:
        assert exc.value.retry_after == "12"


@pytest.mark.parametrize(
    "content,finish",
    [
        ("not json", "stop"),
        (json.dumps(ANSWER), "length"),
        (json.dumps({**ANSWER, "extra": 1}), "stop"),
    ],
)
def test_invalid_model_output_is_rejected(content, finish):
    transport = httpx.MockTransport(
        lambda req: httpx.Response(
            200, json={"choices": [{"finish_reason": finish, "message": {"content": content}}]}
        )
    )
    with pytest.raises(AdvisorError) as exc:
        run(generate(settings(), "Pregunta", {}, transport))
    assert exc.value.code == "groq_invalid_response"


def test_timeout():
    def handler(req):
        raise httpx.ReadTimeout("secret diagnostic")

    with pytest.raises(AdvisorError) as exc:
        run(generate(settings(), "Pregunta", {}, httpx.MockTransport(handler)))
    assert exc.value.code == "groq_timeout"


def test_real_siap_separates_cycle_and_mode():
    result = advisor_context.siap_context(
        AdvisorRequest(message="hola", region="colon_queretaro", crop="maiz_forrajero")
    )
    assert result["status"] == "success"
    assert all(group["cycle"] and group["mode"] for group in result["groups"])
    assert all(
        "pmr_reported_unverified" not in row
        for group in result["groups"]
        for row in group["recent"]
    )
    assert 2015 in result["coverage"]["years_missing"]


def test_excluded_sources_and_no_prediction(app):
    request = AdvisorRequest(
        message="hola",
        region="colon_queretaro",
        crop="alfalfa",
        include_siap=False,
        include_climate=False,
        include_moisture=False,
        include_satellite=False,
    )
    context = run(advisor_context.build_context(app, request))
    assert all(
        context[k]["status"] == "excluded" for k in ("siap", "climate", "moisture", "satellite")
    )
    assert context["forecast"]["value"] is None


def test_route_with_mocked_provider(app, api_request, monkeypatch):
    from app.api.routes import advisor
    from app.schemas.advisor import AdvisorAnswer

    app.state.settings.groq_api_key = SecretStr("test-secret-not-real")

    async def fake_generate(_settings, _message, context):
        assert context["siap"]["status"] == "excluded"
        return AdvisorAnswer(**ANSWER)

    monkeypatch.setattr(advisor, "generate", fake_generate)
    response = api_request(
        "POST",
        "/api/v1/advisor/chat",
        json={
            "message": "Hola",
            "include_siap": False,
            "include_climate": False,
            "include_moisture": False,
            "include_satellite": False,
        },
    )
    assert response.status_code == 200
    assert response.json()["data"]["answer"]["conclusion"] == ANSWER["conclusion"]
    assert "test-secret-not-real" not in response.text


def test_climate_missing_is_not_zero(app):
    from datetime import date, datetime
    from types import SimpleNamespace

    class FakeClimate:
        async def query(self, lat, lon, start, end):
            variable = SimpleNamespace(
                id="PRECTOTCORR", unit="mm/day", spatial_resolution="regional"
            )
            result = SimpleNamespace(
                variables=[variable],
                series=[SimpleNamespace(PRECTOTCORR=None), SimpleNamespace(PRECTOTCORR=2.0)],
                retrieval=SimpleNamespace(
                    model_dump=lambda **kwargs: {"retrieved_at": datetime.now(UTC).isoformat()}
                ),
            )
            return result, []

    app.state.climate_service = FakeClimate()
    result = run(
        advisor_context.climate_context(app, "colon_queretaro", date(2026, 1, 1), date(2026, 1, 2))
    )
    assert result["variables"][0]["missing"] == 1
    assert result["variables"][0]["total_if_complete"] is None


def test_moisture_separates_surface_and_root(app):
    from datetime import date

    class FakeMoisture:
        async def point_series(self, *args):
            return {
                "active_surface_parameter": "GWETTOP",
                "active_root_parameter": "GWETROOT",
                "unit": "índice (0–1)",
                "source_model": "MERRA-2 (NASA POWER)",
                "baseline_start": "2025-01-01",
                "rows": [{"GWETTOP": 0.4, "GWETROOT": None}],
            }

    app.state.soil_power = FakeMoisture()
    result = run(
        advisor_context.moisture_context(app, "colon_queretaro", date(2026, 1, 1), date(2026, 1, 1))
    )
    assert result["metrics"][0]["mean_valid"] == 0.4
    assert result["metrics"][1]["mean_valid"] is None
    assert result["metrics"][1]["unit"] == "índice (0–1)"
