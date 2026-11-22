"""Climate and source endpoints; calculation and IO remain in services."""

import math
import re
from datetime import UTC, date, datetime

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.core.errors import error_response
from app.schemas.climate import ClimateSeries, SourceEntry, SourcesData
from app.schemas.common import FieldError, SuccessResponse
from app.services.climate import source_record
from app.services.power import PARAMETERS, PowerError

router = APIRouter()


@router.get("/climate/series", response_model=SuccessResponse[ClimateSeries])
async def climate_series(
    request: Request, latitude: float, longitude: float, start_date: str, end_date: str
) -> SuccessResponse[ClimateSeries] | JSONResponse:
    allowed = {"latitude", "longitude", "start_date", "end_date"}
    errors: list[FieldError] = []
    for key in request.query_params:
        if key not in allowed or len(request.query_params.getlist(key)) != 1:
            errors.append(FieldError(field=key, message="Campo desconocido o duplicado."))
    if not math.isfinite(latitude) or not -90 <= latitude <= 90:
        errors.append(FieldError(field="latitude", message="Latitud inválida."))
    if not math.isfinite(longitude) or not -180 <= longitude <= 180:
        errors.append(FieldError(field="longitude", message="Longitud inválida."))
    parsed: list[date] = []
    for name, value in (("start_date", start_date), ("end_date", end_date)):
        try:
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value, flags=re.ASCII):
                raise ValueError
            parsed.append(date.fromisoformat(value))
        except ValueError:
            errors.append(FieldError(field=name, message="Fecha inválida; use YYYY-MM-DD."))
    if len(parsed) == 2:
        start, end = parsed
        if start > end or (end - start).days >= 366 or end > datetime.now(UTC).date():
            errors.append(
                FieldError(field="period", message="Periodo inválido o mayor a 366 días.")
            )
    if errors:
        return error_response(
            422, "VALIDATION_ERROR", "La solicitud contiene datos inválidos.", errors
        )
    try:
        result, warnings = await request.app.state.climate_service.query(
            latitude, longitude, *parsed
        )
        return SuccessResponse(data=result, warnings=warnings)
    except PowerError as exc:
        messages = {
            "NASA_TIMEOUT": "NASA POWER no respondió a tiempo.",
            "NASA_RESPONSE_ERROR": "NASA POWER devolvió una respuesta no utilizable.",
            "SERVICE_UNAVAILABLE": "Servicio temporalmente no disponible.",
        }
        return error_response(
            exc.status, exc.code, messages.get(exc.code, "Servicio no disponible.")
        )


@router.get("/sources", response_model=SuccessResponse[SourcesData])
async def sources() -> SuccessResponse[SourcesData]:
    entry = SourceEntry(**source_record().model_dump(), parameters=list(PARAMETERS))
    return SuccessResponse(data=SourcesData(sources=[entry]), warnings=[])
