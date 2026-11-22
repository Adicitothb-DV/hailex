import asyncio
import json

import httpx
import pytest
from pydantic import SecretStr

from app.core.config import Settings
from app.services.fish_audio import synthesize
from app.services.lex_research import classify, opened_sources, research


def test_research_intent():
    assert classify("Hola") == "local_only"
    assert classify("¿Cuál es el precio actual de cebada?") == "web_research"
    assert classify("Investiga y compara tres fuentes") == "web_research_deep"
    assert classify("Find current barley prices") == "web_research"
    assert classify("Do deep research with three sources") == "web_research_deep"
    result = asyncio.run(research(Settings(_env_file=None), "Investiga y compara tres fuentes"))
    assert result["status"] == "unavailable"


def test_browser_search_is_separate_and_sources_not_verified():
    def handler(request):
        payload = json.loads(request.content)
        assert payload["model"] == "openai/gpt-oss-120b"
        assert payload["tools"] == [{"type": "browser_search"}]
        assert "response_format" not in payload
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "finish_reason": "stop",
                        "message": {
                            "content": "dato no verificado",
                            "annotations": [
                                {
                                    "url_citation": {
                                        "title": "Fuente",
                                        "url": "https://example.org/info",
                                    }
                                },
                                {"url_citation": {"title": "interna", "url": "file:///local"}},
                            ],
                        },
                    }
                ]
            },
        )

    settings = Settings(_env_file=None, groq_api_key=SecretStr("test-only"))
    result = asyncio.run(research(settings, "Busca el precio actual", httpx.MockTransport(handler)))
    assert result["status"] == "insufficient_evidence"
    assert len(result["sources"]) == 1
    assert result["sources"][0]["verification_status"] == "search_result_only"
    assert "dato no verificado" not in str(result)


def test_research_uses_opened_search_source_not_generated_claims():
    url = "https://example.org/market"
    tool_results = [
        {
            "name": "browser.search",
            "search_results": {"results": [{"url": url, "title": "Market"}]},
        },
        {
            "name": "browser.open",
            "output": (
                f"L0: \nL1: URL: {url}\nL2: Market bulletin\n"
                "L3: Barley 20 MXN/kg, Querétaro market, observed 2026-11-15."
            ),
        },
    ]
    settings = Settings(_env_file=None, groq_api_key=SecretStr("test-only"))
    transport = httpx.MockTransport(
        lambda req: httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "finish_reason": "length",
                        "message": {
                            "content": "invented price 999",
                            "executed_tools": tool_results,
                        },
                    }
                ]
            },
        )
    )
    result = asyncio.run(research(settings, "Find barley prices", transport))
    assert result["status"] == "source_material_accessed"
    assert result["sources"][0]["verification_status"] == "source_accessed_unverified"
    assert "20 MXN/kg" in result["sources"][0]["excerpt"]
    assert "999" not in str(result)


def test_opened_sources_rejects_unsearched_or_private_urls():
    tools = [
        {
            "name": "browser.search",
            "search_results": {
                "results": [
                    {"url": "http://127.0.0.1/secret", "title": "private"},
                    {"url": "https://example.org/real", "title": "legitimate"},
                ]
            },
        },
        {"name": "browser.open", "output": "L0: URL: http://127.0.0.1/secret\nL1: " + "x" * 100},
        {"name": "browser.open", "output": "L0: URL: https://evil.example/fake\nL1: " + "x" * 100},
    ]
    assert opened_sources({"executed_tools": tools}) == []


def test_price_gate_requires_distinct_domains_and_matching_amount_and_unit():
    from app.api.routes.advisor import has_corroborated_prices

    def source(url, excerpt):
        return {"url": url, "excerpt": excerpt, "verification_status": "source_accessed_unverified"}

    first = source("https://example.org/a", "Precio $20 MXN/kg")
    assert not has_corroborated_prices({"sources": [first]})
    assert not has_corroborated_prices(
        {"sources": [first, source("https://www.example.org/b", "Precio $20 MXN/kg")]}
    )
    assert not has_corroborated_prices(
        {"sources": [first, source("https://example.net/a", "Precio $21 MXN/kg")]}
    )
    assert has_corroborated_prices(
        {"sources": [first, source("https://example.net/a", "Precio $20 MXN/kg")]}
    )


def test_uncorroborated_monetary_answer_is_rejected():
    from app.services.groq_advisor import AdvisorError, generate

    settings = Settings(_env_file=None, groq_api_key=SecretStr("test-only"))
    answer = {
        "conclusion": "Cuesta $20 MXN/kg",
        "interpretation": "",
        "actions": [],
        "limitations": [],
        "follow_up_questions": [],
    }
    transport = httpx.MockTransport(
        lambda req: httpx.Response(
            200,
            json={
                "choices": [{"finish_reason": "stop", "message": {"content": json.dumps(answer)}}]
            },
        )
    )
    with pytest.raises(AdvisorError) as error:
        asyncio.run(
            generate(
                settings,
                "precio",
                {
                    "web_research": {
                        "mode": "web_research",
                        "price_independently_corroborated": False,
                    }
                },
                transport,
            )
        )
    assert error.value.code == "web_price_unverified"


@pytest.mark.parametrize(
    "locale,voice",
    [
        ("es-MX", "d85aae3c4f4d4c70860997c27554f533"),
        ("en-US", "79d0bd3e4e5444b18f7b6d89b5927bf1"),
    ],
)
def test_fish_tts_request(locale, voice):
    def handler(request):
        assert request.url.host == "api.fish.audio"
        assert request.headers["model"] == "s2.1-pro-free"
        assert request.headers["authorization"] == "Bearer test-only"
        body = json.loads(request.content)
        assert body["reference_id"] == voice
        assert body["latency"] == "low"
        return httpx.Response(200, content=b"audio-mock", headers={"content-type": "audio/mpeg"})

    result = asyncio.run(
        synthesize(
            Settings(_env_file=None, fish_audio_api_key=SecretStr("test-only")),
            "Hola",
            httpx.MockTransport(handler),
            locale=locale,
        )
    )
    assert result == b"audio-mock"


def test_tts_invalid_locale_is_rejected(api_request):
    response = api_request("POST", "/api/v1/advisor/tts", json={"text": "hello", "locale": "fr-FR"})
    assert response.status_code == 422


def test_tts_route_forwards_locale(api_request, monkeypatch):
    from app.api.routes import advisor

    async def fake_synthesize(_settings, text, *, locale):
        assert (text, locale) == ("hello", "en-US")
        return b"audio-mock"

    monkeypatch.setattr(advisor, "synthesize", fake_synthesize)
    response = api_request("POST", "/api/v1/advisor/tts", json={"text": "hello", "locale": "en-US"})
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/mpeg"


def test_tts_legacy_request_defaults_to_spanish(api_request, monkeypatch):
    from app.api.routes import advisor

    async def fake_synthesize(_settings, text, *, locale):
        assert (text, locale) == ("hola", "es-MX")
        return b"audio-mock"

    monkeypatch.setattr(advisor, "synthesize", fake_synthesize)
    response = api_request("POST", "/api/v1/advisor/tts", json={"text": "hola"})
    assert response.status_code == 200


def test_tts_missing_key_returns_safe_error(api_request):
    response = api_request("POST", "/api/v1/advisor/tts", json={"text": "hola"})
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "fish_audio_not_configured"


def test_public_config_does_not_reveal_secrets(api_request):
    response = api_request("GET", "/api/v1/advisor/config")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["model"] == "openai/gpt-oss-120b"
    assert data["voice_reference_configured"] is True
    assert "api_key" not in response.text


def test_browser_search_failure_does_not_fabricate_results():
    settings = Settings(_env_file=None, groq_api_key=SecretStr("test-only"))
    result = asyncio.run(
        research(settings, "Precio actual", httpx.MockTransport(lambda req: httpx.Response(429)))
    )
    assert result["status"] == "unavailable"
    assert result["sources"] == []


def test_search_falls_back_to_second_browser_model():
    calls = []

    def handler(request):
        payload = json.loads(request.content)
        calls.append(payload["model"])
        if len(calls) == 1:
            return httpx.Response(429)
        assert payload["tools"] == [{"type": "browser_search"}]
        return httpx.Response(
            200,
            json={"choices": [{"finish_reason": "stop", "message": {"content": "sin fuentes"}}]},
        )

    settings = Settings(_env_file=None, groq_api_key=SecretStr("test-only"))
    result = asyncio.run(research(settings, "precio actual", httpx.MockTransport(handler)))
    assert calls == ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]
    assert result["status"] == "insufficient_evidence"


def test_search_text_urls_are_unverified_and_not_prices():
    settings = Settings(_env_file=None, groq_api_key=SecretStr("test-only"))
    transport = httpx.MockTransport(
        lambda req: httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "finish_reason": "stop",
                        "message": {
                            "content": "Oferta: 100 MXN/t https://example.org/lista. Intrusiva: http://127.0.0.1/secret"
                        },
                    }
                ]
            },
        )
    )
    result = asyncio.run(research(settings, "precio actual cebada", transport))
    assert result["status"] == "insufficient_evidence"
    assert result["sources"] == [
        {
            "url": "https://example.org/lista",
            "title": "Referencia citada en búsqueda",
            "verification_status": "search_result_only",
        }
    ]
    assert "100" not in str(result)


def test_tts_rejects_non_audio_and_limits():
    from app.services.groq_advisor import AdvisorError

    settings = Settings(_env_file=None, fish_audio_api_key=SecretStr("test-only"))
    for status, body, content_type, code in [
        (200, b"not audio", "text/html", "fish_audio_invalid_response"),
        (429, b"", "application/json", "fish_audio_rate_limited"),
    ]:
        transport = httpx.MockTransport(
            lambda req, status=status, body=body, content_type=content_type: httpx.Response(
                status, content=body, headers={"content-type": content_type}
            )
        )
        try:
            asyncio.run(synthesize(settings, "Hola", transport))
            raise AssertionError("Debe rechazar respuesta")
        except AdvisorError as exc:
            assert exc.code == code
