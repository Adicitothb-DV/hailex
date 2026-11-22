"""Local deterministic comparison of crop family transitions."""

import json

from fastapi import APIRouter

from app.analysis.rotation_engine import compare_rotation
from app.schemas.common import SuccessResponse
from app.schemas.rotation_workspace import RotationInput
from app.services import field_monitoring

router = APIRouter(prefix="/rotation-workspace")


@router.post("/compare")
def compare(request: RotationInput):
    result = compare_rotation(request)
    result["satellite"] = None
    if request.analysis_id:
        try:
            manifest = field_monitoring.analysis_path(request.analysis_id) / "manifest.json"
            data = json.loads(manifest.read_text(encoding="utf-8"))
            indices = data.get("indices") or {}
            result["satellite"] = {
                "analysis_id": request.analysis_id,
                "status": data.get("status"),
                "acquired_at": data.get("acquired_at"),
                "ndvi": indices.get("ndvi"),
                "ndmi": indices.get("ndmi"),
                "valid_pixel_percent_in_aoi": data.get("valid_pixel_percent_in_aoi"),
                "note": "Sentinel-2: índices de vegetación; NDMI no es humedad de suelo. No se usan para ordenar cultivos ni diagnosticar causas.",
            }
        except (field_monitoring.FieldError, OSError, ValueError, TypeError, AttributeError):
            result["limitations"].append("Análisis satelital seleccionado no disponible o inválido.")
    return SuccessResponse(data=result, warnings=result["limitations"])