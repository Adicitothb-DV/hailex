"""Inputs for the limited, deterministic rotation comparison."""

from typing import Literal

from pydantic import Field

from app.schemas.common import WireModel

CropId = Literal["maiz_forrajero", "sorgo", "alfalfa", "cebada"]


class RotationInput(WireModel):
    previous_crop: CropId | None = None
    prioritize_family_change: bool = False
    region: Literal["el_marques_queretaro", "colon_queretaro"] | None = None
    water_regime: Literal["rainfed", "irrigated", "unknown"] = "unknown"
    analysis_id: str | None = Field(default=None, pattern=r"^[a-f0-9]{32}$")