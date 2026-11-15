"""Read-only AgroAlert API endpoints using the HaiLex response envelope."""

import math
from datetime import UTC, date, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Query, Request

from app.analysis.agroalert_geometry import LANDMARKS, load_municipalities
from app.core.errors import error_response
from app.services.agroalert_municipality import query_municipality
from app.services.agroalert_power import NASADataError
from app.services.agroalert_regional import regional_grid

router = APIRouter(prefix="/agroalert")


@router.get("/municipalities")
async def municipalities():
    collection = load_municipalities()
    targets = [
        feature
        for feature in collection["features"]
        if feature["properties"].get("cvegeo") in {"22011", "22005"}
    ]
    verified = len(targets) == 2 and all(
        feature["properties"].get("vertices_reales", 0) >= 500 for feature in targets
    )
    return {
        "data": {"collection": collection, "landmarks": LANDMARKS},
        "warnings": []
        if verified
        else ["Los límites locales son simplificados y no se han sincronizado."],
    }


@router.get("/moisture")
async def moisture(
    request: Request,
    municipality: Literal["El Marqués", "Colón"],
    end_date: date,
    history_days: int = Query(default=30, ge=1, le=730),
):
    if end_date > datetime.now(UTC).date() or end_date - timedelta(
        days=max(history_days - 1, 364)
    ) < date(1982, 1, 1):
        return error_response(422, "VALIDATION_ERROR", "La fecha seleccionada no es válida.")
    try:
        data = await query_municipality(
            request.app.state.soil_power, municipality, end_date, history_days
        )
    except NASADataError:
        return error_response(
            503, "SERVICE_UNAVAILABLE", "No fue posible consultar NASA POWER. Intenta de nuevo."
        )
    warnings = []
    if data["failed_cell_count"]:
        warnings.append("Algunas celdas no pudieron consultarse; los resultados son parciales.")
    if not data["latest_by_cell"]:
        warnings.append("Sin lecturas publicadas en el periodo; prueba una fecha final anterior.")
    return {"data": data, "warnings": warnings}


@router.get("/point")
async def point(
    request: Request, latitude: float, longitude: float, start_date: date, end_date: date
):
    if (
        not math.isfinite(latitude)
        or not -90 <= latitude <= 90
        or not math.isfinite(longitude)
        or not -180 <= longitude <= 180
        or end_date > datetime.now(UTC).date()
        or start_date > end_date
        or (end_date - start_date).days >= 730
        or start_date < date(1982, 1, 1)
    ):
        return error_response(422, "VALIDATION_ERROR", "Coordenadas o periodo inválidos.")
    try:
        data = await request.app.state.soil_power.point_series(
            latitude, longitude, start_date, end_date
        )
    except NASADataError:
        return error_response(503, "SERVICE_UNAVAILABLE", "No fue posible consultar NASA POWER.")
    return {"data": data, "warnings": []}


@router.get("/regional")
async def regional(
    request: Request,
    lat_min: float,
    lat_max: float,
    lon_min: float,
    lon_max: float,
    parameter: Literal["SFMC", "RZMC", "GWETTOP", "GWETROOT", "SFMC_PRCNTL", "RZMC_PRCNTL"],
    start_date: date,
    end_date: date,
):
    if (
        start_date > end_date
        or end_date > datetime.now(UTC).date()
        or (end_date - start_date).days >= 366
    ):
        return error_response(422, "VALIDATION_ERROR", "Periodo inválido.")
    try:
        data = await regional_grid(
            request.app.state.soil_power,
            (lat_min, lat_max, lon_min, lon_max),
            parameter,
            start_date,
            end_date,
        )
    except ValueError:
        return error_response(422, "VALIDATION_ERROR", "Área regional inválida.")
    except NASADataError:
        return error_response(
            503, "SERVICE_UNAVAILABLE", "No fue posible consultar NASA POWER regional."
        )
    return {
        "data": data,
        "warnings": [
            "El percentil regional usa todos los registros devueltos, no la referencia temporal por celda."
        ]
        if parameter.endswith("_PRCNTL")
        else [],
    }
