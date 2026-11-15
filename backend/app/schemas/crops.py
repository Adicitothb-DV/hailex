"""Catalog and parcel schemas with explicit provenance and validation."""

from typing import Literal

from pydantic import Field, StrictBool, StrictFloat, StrictInt, StrictStr, model_validator

from app.schemas.climate import Source
from app.schemas.common import WireModel

Evidence = Literal["verified_local", "documented_general", "provisional", "unknown"]


class CropAttribute(WireModel):
    name: str
    value: StrictStr | StrictFloat | StrictInt | StrictBool | None
    unit: str | None
    source_refs: list[str]
    evidence_status: Evidence
    limitations: list[str]

    @model_validator(mode="after")
    def validate_evidence(self):
        if self.value is None and self.evidence_status != "unknown":
            raise ValueError("A missing attribute must be unknown")
        if self.value is not None and (not self.source_refs or self.evidence_status == "unknown"):
            raise ValueError("A known attribute requires evidence and a source")
        if isinstance(self.value, (int, float)) and not isinstance(self.value, bool):
            import math

            if not math.isfinite(self.value) or not self.unit:
                raise ValueError("Numeric attributes require finite values and a unit")
        return self


class Crop(WireModel):
    id: str
    common_name: str
    scientific_name: str | None
    botanical_family: str | None
    attributes: list[CropAttribute]
    identity_source_refs: dict[str, list[str]]
    evidence_status: Evidence
    limitations: list[str]


class CropCatalog(WireModel):
    catalog_version: str
    data_type: Literal["documented_reference"]
    display_label: None
    crops: list[Crop]
    sources: list[Source]

    @model_validator(mode="after")
    def references_exist(self):
        source_ids = {source.id for source in self.sources}
        if len(source_ids) != len(self.sources):
            raise ValueError("Duplicate source ID")
        if len({crop.id for crop in self.crops}) != len(self.crops):
            raise ValueError("Duplicate crop ID")
        for crop in self.crops:
            if crop.evidence_status == "unknown":
                raise ValueError("Named crops require an evidence status")
            if set(crop.identity_source_refs) - {
                "common_name",
                "scientific_name",
                "botanical_family",
            }:
                raise ValueError("Unknown identity field")
            for field in ("common_name", "scientific_name", "botanical_family"):
                value = getattr(crop, field)
                refs = crop.identity_source_refs.get(field, [])
                if value is not None and not refs:
                    raise ValueError(f"Missing identity evidence: {field}")
                if not set(refs) <= source_ids:
                    raise ValueError("Unknown identity source")
            for attribute in crop.attributes:
                if not set(attribute.source_refs) <= source_ids:
                    raise ValueError("Unknown attribute source")
        return self


class ParcelLocation(WireModel):
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)
    source: Literal["user_input"] = "user_input"
    validation_status: Literal["requires_validation", "verified_local"] = "requires_validation"

    @model_validator(mode="before")
    @classmethod
    def reject_boolean_coordinates(cls, value):
        if isinstance(value, dict) and any(
            isinstance(value.get(key), bool) for key in ("latitude", "longitude")
        ):
            raise ValueError("Coordinates must be numeric")
        return value


class ParcelValue(WireModel):
    value: str | None = None
    source: Literal["user_input", "cartographic_reference", "unknown"] = "unknown"
    source_ref: str | None = None
    validation_status: Literal[
        "requires_validation", "provisional", "verified_local", "unknown"
    ] = "unknown"

    @model_validator(mode="after")
    def validate_provenance(self):
        if self.value is None and (self.source != "unknown" or self.validation_status != "unknown"):
            raise ValueError("Unknown values need unknown provenance and validation")
        if self.value is not None and (
            self.source == "unknown" or self.validation_status == "unknown"
        ):
            raise ValueError("Known values need provenance and validation")
        if self.source == "cartographic_reference" and not self.source_ref:
            raise ValueError("Cartographic context requires a source reference")
        if self.value is None and self.source_ref is not None:
            raise ValueError("Unknown values cannot claim a source reference")
        return self


class ParcelProfile(WireModel):
    location: ParcelLocation | None = None
    municipality: ParcelValue = Field(default_factory=ParcelValue)
    current_crop: ParcelValue = Field(default_factory=ParcelValue)
    soil_classification: ParcelValue = Field(default_factory=ParcelValue)
    soil_texture: ParcelValue = Field(default_factory=ParcelValue)
    water_regime: Literal["rainfed", "irrigated", "unknown"] = "unknown"
    water_regime_source: Literal["user_input", "unknown"] = "unknown"
    water_regime_validation: Literal["requires_validation", "verified_local", "unknown"] = "unknown"
    restrictions: list[str] = Field(default_factory=list)
    restrictions_source: Literal["user_input", "unknown"] = "unknown"

    @model_validator(mode="after")
    def validate_inputs(self):
        if self.water_regime == "unknown":
            if self.water_regime_source != "unknown" or self.water_regime_validation != "unknown":
                raise ValueError("Unknown water regime must retain unknown metadata")
        elif self.water_regime_source != "user_input" or self.water_regime_validation == "unknown":
            raise ValueError("Water regime requires user provenance and validation")
        if self.restrictions and self.restrictions_source != "user_input":
            raise ValueError("Restrictions require user provenance")
        if not self.restrictions and self.restrictions_source != "unknown":
            raise ValueError("Empty restrictions retain unknown provenance")
        return self
