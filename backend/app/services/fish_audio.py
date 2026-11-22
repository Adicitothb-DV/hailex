"""Server-side bounded Fish Audio REST TTS."""

from typing import Literal

import httpx

from app.core.config import Settings
from app.services.groq_advisor import AdvisorError

URL = "https://api.fish.audio/v1/tts"


async def synthesize(
    settings: Settings,
    text: str,
    transport=None,
    *,
    locale: Literal["es-MX", "en-US"] = "es-MX",
) -> bytes:
    key = settings.fish_audio_api_key.get_secret_value().strip()
    if not settings.lex_voice_enabled or not key:
        raise AdvisorError(
            "fish_audio_not_configured", 503, "La voz de Lex no está configurada en el backend."
        )
    try:
        async with httpx.AsyncClient(timeout=45, transport=transport, trust_env=False) as client:
            async with client.stream(
                "POST",
                URL,
                headers={"Authorization": f"Bearer {key}", "model": settings.fish_audio_model},
                json={
                    "text": text,
                    "reference_id": (
                        settings.fish_audio_reference_id_en
                        if locale == "en-US"
                        else settings.fish_audio_reference_id
                    ),
                    "format": "mp3",
                    "latency": "low",
                },
            ) as response:
                if response.status_code == 429:
                    raise AdvisorError(
                        "fish_audio_rate_limited", 429, "La voz está limitada temporalmente."
                    )
                if response.status_code in (401, 403):
                    raise AdvisorError(
                        "fish_audio_auth_error", 503, "Fish Audio rechazó la clave o los permisos."
                    )
                if not response.is_success:
                    raise AdvisorError(
                        "fish_audio_unavailable", 503, "La voz no está disponible por ahora."
                    )
                if response.headers.get("content-type", "").split(";")[0].strip().lower() not in (
                    "audio/mpeg",
                    "audio/mp3",
                    "application/octet-stream",
                ):
                    raise AdvisorError(
                        "fish_audio_invalid_response", 502, "Fish Audio no devolvió audio válido."
                    )
                content = bytearray()
                async for chunk in response.aiter_bytes():
                    content.extend(chunk)
                    if len(content) > 4_000_000:
                        raise AdvisorError(
                            "fish_audio_invalid_response",
                            502,
                            "El audio recibido excede el límite.",
                        )
                if not content:
                    raise AdvisorError(
                        "fish_audio_invalid_response", 502, "Fish Audio devolvió audio vacío."
                    )
                return bytes(content)
    except httpx.TimeoutException as exc:
        raise AdvisorError(
            "fish_audio_timeout", 504, "La voz tardó demasiado en responder."
        ) from exc
    except httpx.HTTPError as exc:
        raise AdvisorError(
            "fish_audio_unavailable", 503, "No se pudo conectar con Fish Audio."
        ) from exc
