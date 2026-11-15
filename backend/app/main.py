"""HaiLex foundation. Start from backend with python -m uvicorn app.main:app --reload."""

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException

from app.api.router import router
from app.core.config import SERVICE_VERSION, Settings
from app.core.errors import http_error_handler, validation_error_handler
from app.core.logging import configure_logging
from app.core.middleware import (
    ContractCORSMiddleware,
    ErrorBoundaryMiddleware,
    RequestContextMiddleware,
)
from app.schemas.common import ErrorResponse
from app.services.climate import ClimateService


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings if settings is not None else Settings()
    configure_logging()
    application = FastAPI(
        title="HaiLex API",
        version=SERVICE_VERSION,
        description="Infraestructura inicial; health no comprueba proveedores externos.",
        debug=False,
        responses={
            400: {"model": ErrorResponse},
            404: {"model": ErrorResponse},
            405: {"model": ErrorResponse},
            422: {"model": ErrorResponse},
            500: {"model": ErrorResponse},
        },
    )
    application.state.settings = settings
    application.state.climate_service = ClimateService(settings)
    application.add_exception_handler(HTTPException, http_error_handler)
    application.add_exception_handler(RequestValidationError, validation_error_handler)
    application.include_router(router)
    # add_middleware inserts at the front: request ID -> CORS -> boundary -> routes.
    application.add_middleware(ErrorBoundaryMiddleware)
    application.add_middleware(
        ContractCORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
        allow_credentials=False,
        expose_headers=["X-Request-ID"],
    )
    application.add_middleware(RequestContextMiddleware)
    return application


app = create_app()
