"""Crop catalog endpoint without provider calls."""

from fastapi import APIRouter

from app.schemas.common import SuccessResponse
from app.schemas.crops import CropCatalog
from app.services.crops import load_catalog

router = APIRouter()


@router.get("/crops", response_model=SuccessResponse[CropCatalog])
async def crops() -> SuccessResponse[CropCatalog]:
    catalog = load_catalog()
    warnings = ["Catálogo provisional; requisitos y condiciones locales requieren validación."]
    if not catalog.crops:
        warnings.append("El catálogo está vacío.")
    return SuccessResponse(data=catalog, warnings=warnings)
