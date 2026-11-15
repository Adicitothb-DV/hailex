"""Bounded advisor inputs and structured response."""

from typing import Literal

from pydantic import Field, model_validator

from app.schemas.common import WireModel
from app.schemas.rotation_workspace import CropId


class AdvisorProfile(WireModel):
    municipality: str = Field(default="", max_length=150)
    locality: str = Field(default="", max_length=150)
    crops: str = Field(default="", max_length=300)
    water: str = Field(default="", max_length=300)
    objective: str = Field(default="", max_length=300)
    restrictions: str = Field(default="", max_length=1000)
    notes: str = Field(default="", max_length=1000)


class AdvisorTurn(WireModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class AdvisorRequest(WireModel):
    message: str = Field(min_length=1, max_length=4000)
    locale: Literal["es-MX", "en-US"] = "es-MX"
    region: Literal["el_marques_queretaro", "colon_queretaro"] | None = None
    crop: CropId | None = None
    water_regime: Literal["unknown", "rainfed", "irrigated"] = "unknown"
    analysis_id: str | None = Field(default=None, pattern=r"^[a-f0-9]{32}$")
    profile: AdvisorProfile | None = None
    include_siap: bool = True
    include_climate: bool = True
    include_moisture: bool = True
    include_satellite: bool = True
    include_web: bool = False
    history: list[AdvisorTurn] = Field(default_factory=list, max_length=4)

    @model_validator(mode="after")
    def validate_history(self):
        if sum(len(turn.content) for turn in self.history) > 12000:
            raise ValueError("El historial supera el límite permitido.")
        if (
            any(
                turn.role != ("user" if i % 2 == 0 else "assistant")
                for i, turn in enumerate(self.history)
            )
            or len(self.history) % 2
        ):
            raise ValueError("El historial debe contener pares completos de consulta y respuesta.")
        return self


class AdvisorAnswer(WireModel):
    conclusion: str = Field(min_length=1, max_length=2500)
    interpretation: str = Field(max_length=4000)
    actions: list[str] = Field(max_length=8)
    limitations: list[str] = Field(max_length=8)
    follow_up_questions: list[str] = Field(max_length=4)
