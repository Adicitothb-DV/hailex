"""SIAP workbook records, with explicit source and quality limitations."""

from fastapi import APIRouter

from app.core.errors import error_response
from app.schemas.common import SuccessResponse
from app.services.agriculture import records

router = APIRouter(prefix="/agriculture")


@router.get("/series")
def series(
    region: str | None = None,
    crop: str | None = None,
    cycle: str | None = None,
    mode: str | None = None,
):
    try:
        data = records(region, crop, cycle, mode)
    except (OSError, ValueError, KeyError):
        return error_response(503, "SOURCE_INVALID", "No se pudo leer o validar el libro agrícola.")
    return SuccessResponse(
        data=data,
        warnings=[data["price_warning"]]
        if "price_warning" in data
        else ["No se encontró el libro SIAP local."],
    )


@router.get("/coverage")
def coverage():
    try:
        data = records()
    except (OSError, ValueError, KeyError):
        return error_response(503, "SOURCE_INVALID", "No se pudo leer o validar el libro agrícola.")
    return SuccessResponse(
        data={"status": data["status"], "coverage": data["coverage"]}, warnings=[]
    )
