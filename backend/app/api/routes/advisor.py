"""Advisor endpoint; the browser never receives the provider key."""

import re
from typing import Literal
from urllib.parse import urlsplit

from fastapi import APIRouter, Request
from fastapi.responses import Response
from pydantic import Field

from app.core.errors import error_response
from app.schemas.advisor import AdvisorRequest
from app.schemas.common import SuccessResponse, WireModel
from app.services.advisor_context import build_context
from app.services.advisor_prompt import PROMPT_VERSION
from app.services.fish_audio import synthesize
from app.services.groq_advisor import MODEL, MODELS, AdvisorError, generate
from app.services.lex_research import research

router = APIRouter(prefix="/advisor")


def has_corroborated_prices(result: dict) -> bool:
    """Require two independent source domains to expose the same price/unit expression.

    This conservative gate does not prove the same product, location, or date; those must
    still be checked against the excerpts. A matching numeric amount alone is insufficient.
    """
    pattern = re.compile(
        r"(?i)(?:\b(?:mxn|usd)\s*|\$\s*)\d[\d,]*(?:\.\d{1,2})?\s*"
        r"(?:mxn|usd|pesos)?\s*(?:/|por|per)\s*(?:kg|kilo(?:gramo)?s?|ton(?:elada)?s?)\b"
    )
    occurrences: dict[str, set[str]] = {}
    for source in result.get("sources", []):
        if (
            not isinstance(source, dict)
            or source.get("verification_status") != "source_accessed_unverified"
        ):
            continue
        url, excerpt = source.get("url"), source.get("excerpt")
        if not isinstance(url, str) or not isinstance(excerpt, str):
            continue
        host = (urlsplit(url).hostname or "").removeprefix("www.")
        for match in pattern.finditer(excerpt):
            key = re.sub(r"\s+", "", match.group().lower())
            occurrences.setdefault(key, set()).add(host)
    return any(len(hosts) >= 2 for hosts in occurrences.values())


class TTSRequest(WireModel):
    text: str = Field(min_length=1, max_length=1800)
    locale: Literal["es-MX", "en-US"] = "es-MX"


@router.get("/config")
async def config(request: Request):
    settings = request.app.state.settings
    return SuccessResponse(
        data={
            "model": MODEL,
            "fallback_models": list(MODELS[1:]),
            "voice_enabled": settings.lex_voice_enabled,
            "tts_configured": bool(settings.fish_audio_api_key.get_secret_value().strip()),
            "voice_reference_configured": bool(settings.fish_audio_reference_id),
            "voice_reference_en_configured": bool(settings.fish_audio_reference_id_en),
            "tts_model": settings.fish_audio_model,
            "web_research_enabled": settings.lex_web_research_enabled,
            "wake_word_supported_by_server": False,
        },
        warnings=[],
    )


@router.post("/tts")
async def tts(body: TTSRequest, request: Request):
    try:
        audio = await synthesize(request.app.state.settings, body.text, locale=body.locale)
        return Response(
            content=audio, media_type="audio/mpeg", headers={"Cache-Control": "no-store"}
        )
    except AdvisorError as exc:
        return error_response(exc.status, exc.code, exc.message)


@router.post("/chat")
async def chat(body: AdvisorRequest, request: Request):
    settings = request.app.state.settings
    if not settings.groq_api_key.get_secret_value().strip():
        return error_response(
            503, "groq_api_key_missing", "La clave Groq no está configurada en el backend."
        )
    try:
        context = await build_context(request.app, body)
        if body.include_web:
            research_result = await research(settings, body.message)
        else:
            research_result = {
                "mode": "local_only",
                "status": "excluded",
                "sources": [],
                "retrieved_at": None,
            }
        context["web_research"] = research_result
        context["web_research"]["price_independently_corroborated"] = has_corroborated_prices(
            research_result
        )
        answer = await generate(
            settings, body.message, context, history=body.history, locale=body.locale
        )
    except AdvisorError as exc:
        headers = {"Retry-After": exc.retry_after} if exc.retry_after else None
        return error_response(exc.status, exc.code, exc.message, headers=headers)
    return SuccessResponse(
        data={
            "answer": answer.model_dump(),
            "context": context,
            "model": answer._model_used,
            "prompt_version": PROMPT_VERSION,
        },
        warnings=[
            "Interpretación generada por IA; no sustituye visita técnica. No hay pronóstico numérico validado."
        ],
    )
