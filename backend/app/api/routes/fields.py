"""Bounded field analysis API."""

from datetime import date
from pathlib import Path

import httpx
import rasterio
from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from pydantic import Field

from app.core.errors import error_response
from app.schemas.common import SuccessResponse, WireModel
from app.services import field_monitoring as service

router = APIRouter(prefix="/fields")


class FieldRequest(WireModel):
    geometry: dict
    start_date: date
    end_date: date
    max_cloud: float = Field(default=40, ge=0, le=100, allow_inf_nan=False)
    name: str = Field(default="Parcela", max_length=100)
    municipality: str = Field(default="", max_length=100)
    crop: str = Field(default="", max_length=100)
    item_id: str | None = Field(default=None, max_length=150)


class GeometryRequest(WireModel):
    geometry: dict


@router.post("/validate")
def validate_field(request: GeometryRequest):
    try:
        area, perimeter, bounds = service.validate_geometry(request.geometry)
        return SuccessResponse(
            data={"area_ha": area, "perimeter_m": perimeter, "bbox": bounds},
            warnings=["Polígono declarado por el usuario; no es un linde legal."],
        )
    except service.FieldError as exc:
        return error_response(422, "VALIDATION_ERROR", str(exc))


@router.post("/scenes")
async def scenes(request: FieldRequest):
    try:
        items = await run_in_threadpool(
            service.search_scenes,
            request.geometry,
            request.start_date,
            request.end_date,
            request.max_cloud,
        )
        return SuccessResponse(
            data=[
                {
                    "item_id": item["id"],
                    "acquired_at": item["properties"].get("datetime"),
                    "cloud_cover_scene_percent": item["properties"].get("eo:cloud_cover"),
                }
                for item in items
            ],
            warnings=["La nube reportada corresponde a toda la escena, no a la parcela."],
        )
    except service.FieldError as exc:
        return error_response(422, "VALIDATION_ERROR", str(exc))
    except (httpx.HTTPError, ValueError, KeyError):
        return error_response(
            503,
            "PROVIDER_UNAVAILABLE",
            "Earth Search no está disponible o devolvió datos no utilizables.",
        )


@router.post("/analyses")
async def create_analysis(request: FieldRequest):
    try:
        data = await run_in_threadpool(
            service.analyze,
            request.geometry,
            request.start_date,
            request.end_date,
            request.max_cloud,
            request.name,
            request.municipality,
            request.crop,
            request.item_id,
        )
        return SuccessResponse(data=data, warnings=data.get("warnings", []))
    except service.FieldError as exc:
        return error_response(422, "VALIDATION_ERROR", str(exc))
    except (httpx.HTTPError, rasterio.errors.RasterioError, OSError, ValueError, KeyError):
        return error_response(
            503, "PROVIDER_UNAVAILABLE", "No fue posible leer o procesar la escena satelital."
        )


@router.get("/analyses")
def list_saved_analyses():
    return SuccessResponse(
        data=service.list_analyses(),
        warnings=["Resultados archivados localmente; no son consultas en vivo."],
    )


@router.get("/analyses/{analysis_id}")
def get_analysis(analysis_id: str):
    import json

    try:
        manifest = service.analysis_path(analysis_id) / "manifest.json"
    except service.FieldError:
        return error_response(404, "NOT_FOUND", "Análisis no encontrado.")
    if not manifest.is_file():
        return error_response(404, "NOT_FOUND", "Análisis no encontrado.")
    return SuccessResponse(data=json.loads(manifest.read_text(encoding="utf-8")), warnings=[])


@router.get("/analyses/{analysis_id}/report")
def report(analysis_id: str):
    return get_analysis(analysis_id)


@router.get("/analyses/{analysis_id}/layers/{layer_name}")
def layer(analysis_id: str, layer_name: str):
    if layer_name not in ("true-color", "ndvi", "ndmi"):
        return error_response(404, "NOT_FOUND", "Capa no encontrada.")
    try:
        path: Path = service.analysis_path(analysis_id) / f"{layer_name}.png"
    except service.FieldError:
        return error_response(404, "NOT_FOUND", "Capa no encontrada.")
    if not path.is_file():
        return error_response(404, "NOT_FOUND", "Capa no encontrada.")
    return FileResponse(path, media_type="image/png")
