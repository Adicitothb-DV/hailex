"""Advisor endpoint; the browser never receives the provider key."""

from fastapi import APIRouter, Request

from app.core.errors import error_response
from app.schemas.advisor import AdvisorRequest
from app.schemas.common import SuccessResponse
from app.services.advisor_context import build_context
from app.services.advisor_prompt import PROMPT_VERSION
from app.services.groq_advisor import MODEL, AdvisorError, generate

router = APIRouter(prefix="/advisor")


@router.post("/chat")
async def chat(body: AdvisorRequest, request: Request):
    settings = request.app.state.settings
    if not settings.groq_api_key.get_secret_value().strip():
        return error_response(
            503, "groq_api_key_missing", "La clave Groq no está configurada en el backend."
        )
    try:
        context = await build_context(request.app, body)
        answer = await generate(settings, body.message, context)
    except AdvisorError as exc:
        headers = {"Retry-After": exc.retry_after} if exc.retry_after else None
        return error_response(exc.status, exc.code, exc.message, headers=headers)
    return SuccessResponse(
        data={
            "answer": answer.model_dump(),
            "context": context,
            "model": MODEL,
            "prompt_version": PROMPT_VERSION,
        },
        warnings=[
            "Interpretación generada por IA; no sustituye visita técnica. No hay pronóstico numérico validado."
        ],
    )
