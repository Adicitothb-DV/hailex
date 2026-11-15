"""Groq chat with bounded, model-aware fallback and no secret logging."""

import json
import re

import httpx
from pydantic import ValidationError

from app.core.config import Settings
from app.schemas.advisor import AdvisorAnswer, AdvisorTurn
from app.services.advisor_prompt import prompt_for_locale

MODEL = "openai/gpt-oss-120b"
MODELS = (MODEL, "openai/gpt-oss-20b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant")
URL = "https://api.groq.com/openai/v1/chat/completions"


class AdvisorError(Exception):
    def __init__(self, code: str, status: int, message: str, retry_after: str | None = None):
        self.code, self.status, self.message, self.retry_after = code, status, message, retry_after
        super().__init__(message)


async def generate(
    settings: Settings,
    message: str,
    context: dict,
    transport=None,
    *,
    history: list[AdvisorTurn] | None = None,
    locale: str = "es-MX",
) -> AdvisorAnswer:
    key = settings.groq_api_key.get_secret_value().strip()
    if not key:
        raise AdvisorError(
            "groq_api_key_missing", 503, "La clave Groq no está configurada en el backend."
        )
    encoded = json.dumps(context, ensure_ascii=False, allow_nan=False, separators=(",", ":"))
    if len(encoded) > 24000:
        raise AdvisorError(
            "advisor_context_too_large",
            422,
            "El contexto excede el límite permitido; desactiva alguna fuente.",
        )
    # Keep the provider schema minimal; Pydantic applies length limits after decoding.
    schema = {
        "type": "object",
        "properties": {
            "conclusion": {"type": "string"},
            "interpretation": {"type": "string"},
            "actions": {"type": "array", "items": {"type": "string"}},
            "limitations": {"type": "array", "items": {"type": "string"}},
            "follow_up_questions": {"type": "array", "items": {"type": "string"}},
        },
        "required": [
            "conclusion",
            "interpretation",
            "actions",
            "limitations",
            "follow_up_questions",
        ],
        "additionalProperties": False,
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": prompt_for_locale(locale)},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "question": message,
                        "previous_conversation": [turn.model_dump() for turn in (history or [])],
                        "evidence": context,
                    },
                    ensure_ascii=False,
                    allow_nan=False,
                ),
            },
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "agronomic_answer", "strict": True, "schema": schema},
        },
        "max_completion_tokens": settings.groq_max_completion_tokens,
        "reasoning_effort": "medium",
        "stream": False,
    }
    response = None
    last_error = None
    model_used = MODEL
    async with httpx.AsyncClient(
        timeout=min(settings.groq_timeout_seconds, 25), transport=transport, trust_env=False
    ) as client:
        for model_used in MODELS:
            payload["model"] = model_used
            if model_used.startswith("llama-"):
                payload["response_format"] = {"type": "json_object"}
                payload.pop("reasoning_effort", None)
                payload["messages"][0]["content"] = prompt_for_locale(locale) + (
                    "\nDevuelve un objeto JSON con conclusion, interpretation, actions, "
                    "limitations y follow_up_questions; los tres últimos son listas de texto."
                )
            try:
                response = await client.post(
                    URL, headers={"Authorization": f"Bearer {key}"}, json=payload
                )
            except httpx.TimeoutException as exc:
                response = None
                last_error = AdvisorError(
                    "groq_timeout", 504, "Groq no respondió a tiempo. Tu consulta se conserva."
                )
                last_error.__cause__ = exc
                continue
            except httpx.HTTPError as exc:
                raise AdvisorError(
                    "groq_provider_error", 503, "No se pudo conectar con Groq."
                ) from exc
            if response.status_code not in (403, 404, 429, 500, 502, 503, 504):
                break
        else:
            if response is None and last_error is not None:
                raise last_error
    if response is None:
        raise last_error or AdvisorError(
            "groq_provider_error", 503, "No se pudo conectar con Groq."
        )
    if response.status_code == 429:
        retry = response.headers.get("retry-after", "")
        retry = retry if retry.isascii() and retry.isdigit() and len(retry) <= 6 else None
        raise AdvisorError(
            "groq_rate_limited",
            429,
            "Cuota de Groq alcanzada temporalmente. Intenta más tarde.",
            retry,
        )
    if response.status_code in (401, 403):
        raise AdvisorError(
            "groq_auth_error", 503, "Groq rechazó la clave o los permisos del modelo."
        )
    if response.status_code == 404:
        raise AdvisorError(
            "groq_model_unavailable", 503, "El modelo Groq no está disponible para esta cuenta."
        )
    if not response.is_success:
        raise AdvisorError("groq_provider_error", 503, "Groq no pudo completar la consulta.")
    try:
        body = response.json()
        choice = body["choices"][0]
        if choice.get("finish_reason") != "stop":
            raise ValueError("incomplete")
        content = choice["message"]["content"]
        if not isinstance(content, str) or len(content) > 20000:
            raise ValueError("invalid content")
        if key in content:
            raise ValueError("credential in response")
        parsed = json.loads(content)
        if not isinstance(parsed, dict):
            raise ValueError("invalid response object")
        for field, maximum in (("actions", 8), ("limitations", 8), ("follow_up_questions", 4)):
            if isinstance(parsed.get(field), list):
                parsed[field] = parsed[field][:maximum]
        answer = AdvisorAnswer.model_validate(parsed)
        answer._model_used = model_used
        research = context.get("web_research")
        if (
            isinstance(research, dict)
            and research.get("mode") != "local_only"
            and not research.get("price_independently_corroborated", False)
        ):
            monetary = re.compile(
                r"(?i)(?:\$\s*\d|\b(?:mxn|usd)\s*\d|\d[\d,.]*\s*(?:mxn|usd|pesos?|d[oó]lares?)\b)"
            )
            if any(
                monetary.search(value)
                for value in (
                    answer.conclusion,
                    answer.interpretation,
                    *answer.actions,
                    *answer.limitations,
                    *answer.follow_up_questions,
                )
            ):
                raise AdvisorError(
                    "web_price_unverified",
                    422,
                    "No hay evidencia suficiente para verificar ese precio. Consulta las fuentes antes de usarlo.",
                )
        if any(
            len(item) > 1200
            for group in (answer.actions, answer.limitations, answer.follow_up_questions)
            for item in group
        ):
            raise ValueError("field too long")
        return answer
    except (ValueError, KeyError, IndexError, TypeError, ValidationError) as exc:
        raise AdvisorError(
            "groq_invalid_response", 502, "Groq devolvió una respuesta incompleta o inválida."
        ) from exc
