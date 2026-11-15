"""Only the foundation's public wire models, matching API contract V1."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class WireModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SuccessResponse[T](WireModel):
    data: T
    warnings: list[str] = Field(default_factory=list)


class HealthData(WireModel):
    status: Literal["ok"] = "ok"
    service: Literal["hailex-api"] = "hailex-api"
    version: str
    contract_version: Literal["1.0.0"] = "1.0.0"


class FieldError(WireModel):
    field: str
    message: str


class ErrorData(WireModel):
    code: str
    message: str
    request_id: str
    fields: list[FieldError] = Field(default_factory=list)


class ErrorResponse(WireModel):
    error: ErrorData
