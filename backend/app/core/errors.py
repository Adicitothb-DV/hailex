"""Contract errors, with safe messages independent of user input values."""

from pathlib import Path
from traceback import extract_tb

from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.logging import logger, request_id_context
from app.schemas.common import ErrorData, ErrorResponse, FieldError

HTTP_ERRORS = {
    400: ("INVALID_REQUEST", "Solicitud inválida."),
    401: ("UNAUTHORIZED", "Se requiere autorización."),
    403: ("FORBIDDEN", "Solicitud no permitida."),
    404: ("NOT_FOUND", "Ruta o recurso inexistente."),
    405: ("METHOD_NOT_ALLOWED", "Método no admitido."),
    422: ("VALIDATION_ERROR", "La solicitud contiene datos inválidos."),
    500: ("INTERNAL_ERROR", "Ocurrió un error interno."),
    503: ("SERVICE_UNAVAILABLE", "Servicio temporalmente no disponible."),
}


def error_response(
    status: int,
    code: str,
    message: str,
    fields: list[FieldError] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    payload = ErrorResponse(
        error=ErrorData(
            code=code,
            message=message,
            request_id=request_id_context.get(),
            fields=fields or [],
        )
    )
    return JSONResponse(payload.model_dump(), status_code=status, headers=headers)


async def http_error_handler(request: Request, exc: HTTPException) -> JSONResponse:
    code, message = HTTP_ERRORS.get(exc.status_code, ("HTTP_ERROR", "Solicitud no completada."))
    # Do not echo arbitrary exception details or authentication data.
    headers = {"Allow": exc.headers["Allow"]} if exc.headers and "Allow" in exc.headers else None
    return error_response(exc.status_code, code, message, headers=headers)


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = exc.errors()
    invalid_json = any(error["type"] == "json_invalid" for error in errors)
    fields = [
        FieldError(
            # Location identifies the schema field, never the submitted input value.
            field=".".join(str(part) for part in error["loc"]),
            message="Campo requerido." if error["type"] == "missing" else "Valor inválido.",
        )
        for error in errors
    ]
    return error_response(
        400 if invalid_json else 422,
        "INVALID_JSON" if invalid_json else "VALIDATION_ERROR",
        "JSON inválido." if invalid_json else "La solicitud contiene datos inválidos.",
        fields,
    )


def internal_error_response(exc: Exception) -> JSONResponse:
    frames = [f"{Path(f.filename).name}:{f.lineno}:{f.name}" for f in extract_tb(exc.__traceback__)]
    # Locations/type aid diagnosis without exception messages, locals or credentials.
    logger.error("Unhandled %s frames=%s", type(exc).__name__, frames)
    return error_response(500, "INTERNAL_ERROR", "Ocurrió un error interno.")
