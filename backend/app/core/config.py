"""Validated local settings; no external services are initialized here."""

from pathlib import Path
from typing import Annotated, Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

SERVICE_VERSION = "0.1.0"
CONTRACT_VERSION = "1.0.0"
BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: Literal["development", "test", "production"] = "development"
    app_port: int = Field(default=8000, ge=1, le=65535)
    nasa_power_base_url: str = "https://power.larc.nasa.gov/api/temporal/daily/point"
    nasa_power_timeout_seconds: float = Field(default=15, gt=0, le=120, allow_inf_nan=False)
    groq_api_key: SecretStr = SecretStr("")
    groq_timeout_seconds: float = Field(default=60, gt=0, le=120, allow_inf_nan=False)
    groq_max_completion_tokens: int = Field(default=1600, ge=128, le=4000)
    fish_audio_api_key: SecretStr = SecretStr("")
    fish_audio_reference_id: str = Field(
        default="d85aae3c4f4d4c70860997c27554f533", pattern=r"^[a-f0-9]{32}$"
    )
    fish_audio_reference_id_en: str = Field(
        default="79d0bd3e4e5444b18f7b6d89b5927bf1", pattern=r"^[a-f0-9]{32}$"
    )
    fish_audio_model: Literal["s2.1-pro-free", "s2-pro", "s1"] = "s2.1-pro-free"
    lex_voice_enabled: bool = True
    lex_web_research_enabled: bool = True
    climate_cache_ttl_seconds: int = Field(default=1800, ge=1, le=86400)
    climate_cache_max_entries: int = Field(default=128, ge=1, le=4096)
    climate_snapshot_max_entries: int = Field(default=1024, ge=1, le=10000)
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )

    @field_validator("nasa_power_base_url")
    @classmethod
    def validate_nasa_url(cls, value: str) -> str:
        parsed = urlsplit(value)
        if (
            parsed.scheme != "https"
            or parsed.hostname != "power.larc.nasa.gov"
            or parsed.path != "/api/temporal/daily/point"
            or parsed.username is not None
            or parsed.password is not None
            or parsed.port not in (None, 443)
            or parsed.query
            or parsed.fragment
        ):
            raise ValueError("La URL NASA POWER debe ser el endpoint HTTPS oficial.")
        return value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("cors_origins")
    @classmethod
    def validate_origins(cls, origins: list[str]) -> list[str]:
        if not origins:
            raise ValueError("Debe configurar al menos un origen CORS explícito.")
        for origin in origins:
            parsed = urlsplit(origin)
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.hostname
                or parsed.username is not None
                or parsed.password is not None
                or parsed.path
                or parsed.query
                or parsed.fragment
                or "*" in origin
            ):
                raise ValueError("CORS requiere orígenes HTTP(S) sin rutas ni comodines.")
            # Accessing port also validates malformed and out-of-range port numbers.
            _ = parsed.port
        return list(dict.fromkeys(origins))
