"""Collect bounded, explicitly scoped evidence before contacting the model."""

import asyncio
import json
import math
from datetime import UTC, datetime, timedelta

from app.analysis.rotation_engine import compare_rotation
from app.schemas.advisor import AdvisorRequest
from app.schemas.rotation_workspace import RotationInput
from app.services import agriculture, field_monitoring
from app.services.agroalert_power import NASADataError
from app.services.power import PowerError

POINTS = {
    "el_marques_queretaro": (20.60656972, -100.33109667),
    "colon_queretaro": (20.78832639, -100.04543056),
}


def siap_context(request: AdvisorRequest) -> dict:
    if not request.region or not request.crop:
        return {"status": "not_assessable", "reason": "Selecciona municipio y cultivo."}
    mode = {"rainfed": "Temporal", "irrigated": "Riego"}.get(request.water_regime)
    try:
        data = agriculture.records(region=request.region, crop=request.crop, mode=mode)
    except (OSError, ValueError, KeyError):
        return {"status": "unavailable", "reason": "No se pudo leer el consolidado SIAP local."}
    rows = data["records"]
    # Keep cycle and regime separated; recent observations are not averaged across groups.
    groups = {}
    for row in rows:
        key = (row["cycle"], row["mode"], row["unit"])
        groups.setdefault(key, []).append(row)
    series = []
    for (cycle, regime, unit), items in sorted(groups.items(), key=lambda item: str(item[0])):
        recent = sorted(items, key=lambda row: row["year"], reverse=True)[:5]
        series.append(
            {
                "cycle": cycle,
                "mode": regime,
                "production_unit": unit,
                "records_count": len(items),
                "years": sorted({row["year"] for row in items}),
                "recent": [
                    {
                        key: row[key]
                        for key in ("year", "planted", "harvested", "volume", "yield_reported")
                    }
                    for row in recent
                ],
            }
        )
    return {
        "status": data["status"],
        "source": data.get("source"),
        "region": request.region,
        "crop": request.crop,
        "groups": series,
        "coverage": data.get("coverage"),
        "limitation": "Estadísticas municipales, no de parcela; sin precio actual ni interpolación. Superficies en hectáreas; producción en la unidad indicada; unidad de rendimiento reportado requiere verificación.",
    }


def satellite_context(analysis_id: str | None) -> dict:
    if not analysis_id:
        return {"status": "not_selected"}
    try:
        path = field_monitoring.analysis_path(analysis_id) / "manifest.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        indices = data.get("indices") or {}
        return {
            "status": data.get("status"),
            "analysis_id": analysis_id,
            "acquired_at": data.get("acquired_at"),
            "item_id": data.get("item_id"),
            "aoi": {
                k: (data.get("aoi") or {}).get(k) for k in ("area_ha", "municipality_label", "crop")
            },
            "ndvi": indices.get("ndvi"),
            "ndmi": indices.get("ndmi"),
            "valid_ndvi_percent": data.get("valid_pixel_percent_in_aoi"),
            "valid_ndmi_percent": data.get("ndmi_valid_pixel_percent_in_aoi"),
            "limitations": "Sentinel-2 no identifica causas; NDMI no es humedad de suelo.",
        }
    except (field_monitoring.FieldError, OSError, ValueError, TypeError, AttributeError):
        return {"status": "unavailable"}


async def climate_context(app, region: str, start, end) -> dict:
    lat, lon = POINTS[region]
    try:
        result, warnings = await app.state.climate_service.query(lat, lon, start, end)
        metrics = []
        for variable in result.variables:
            values = [getattr(row, variable.id) for row in result.series]
            valid = [v for v in values if v is not None and math.isfinite(v)]
            metric = {
                "id": variable.id,
                "unit": variable.unit,
                "valid": len(valid),
                "missing": len(values) - len(valid),
                "spatial_resolution": variable.spatial_resolution,
                "mean_valid": sum(valid) / len(valid) if valid else None,
            }
            if variable.id == "PRECTOTCORR":
                metric["total_if_complete"] = (
                    sum(valid) if valid and len(valid) == len(values) else None
                )
                metric["total_unit"] = "mm"
            metrics.append(metric)
        return {
            "status": "available" if any(metric["valid"] for metric in metrics) else "empty",
            "source": "NASA POWER Daily",
            "location": {"latitude": lat, "longitude": lon, "type": "municipal_reference_point"},
            "period": {"start": start.isoformat(), "end": end.isoformat()},
            "retrieval": result.retrieval.model_dump(mode="json"),
            "variables": metrics,
            "warnings": warnings,
            "limitation": "Celda/punto de referencia, no medición en parcela.",
        }
    except (TimeoutError, PowerError, ValueError, TypeError, AttributeError):
        return {"status": "unavailable", "source": "NASA POWER Daily"}


async def moisture_context(app, region: str, start, end) -> dict:
    lat, lon = POINTS[region]
    try:
        data = await app.state.soil_power.point_series(lat, lon, start, end)
        metrics = []
        for key in (data["active_surface_parameter"], data["active_root_parameter"]):
            values = [row.get(key) for row in data["rows"]]
            valid = [v for v in values if isinstance(v, (int, float)) and math.isfinite(v)]
            metrics.append(
                {
                    "parameter": key,
                    "unit": data["unit"],
                    "valid": len(valid),
                    "missing": len(values) - len(valid),
                    "mean_valid": sum(valid) / len(valid) if valid else None,
                }
            )
        return {
            "status": "available" if any(metric["valid"] for metric in metrics) else "empty",
            "source": data["source_model"],
            "period": {"start": start.isoformat(), "end": end.isoformat()},
            "location": {"latitude": lat, "longitude": lon, "type": "municipal_reference_point"},
            "metrics": metrics,
            "baseline_start": data["baseline_start"],
            "limitation": "Estimación de celda; no es sensor predial. Superficie y raíz son variables distintas.",
        }
    except (TimeoutError, NASADataError, ValueError, KeyError, TypeError):
        return {"status": "unavailable", "source": "NASA POWER soil moisture"}


async def build_context(app, request: AdvisorRequest) -> dict:
    end = datetime.now(UTC).date() - timedelta(days=1)
    start = end - timedelta(days=29)
    context = {
        "profile_user_reported": request.profile.model_dump(exclude_none=True)
        if request.profile
        else None,
        "parcel_user_reported": {
            "region": request.region,
            "previous_crop": request.crop,
            "water_regime": request.water_regime,
        },
        "rotation": compare_rotation(
            RotationInput(
                previous_crop=request.crop, region=request.region, water_regime=request.water_regime
            )
        ),
        "siap": await asyncio.to_thread(siap_context, request)
        if request.include_siap
        else {"status": "excluded"},
        "satellite": satellite_context(request.analysis_id)
        if request.include_satellite
        else {"status": "excluded"},
        "forecast": {
            "status": "forecast_not_reliable",
            "value": None,
            "reason": "Sin modelo validado y evaluación temporal fuera de muestra.",
        },
        "cross_source_limitation": "El análisis satelital no se ha asociado de forma verificable al municipio o cultivo declarados; comprobar coincidencia. Los puntos NASA son municipales, no centroides de parcelas.",
    }

    async def safe_climate():
        return await asyncio.wait_for(climate_context(app, request.region, start, end), 35)

    async def safe_moisture():
        return await asyncio.wait_for(moisture_context(app, request.region, start, end), 35)

    jobs = []
    for name, enabled, job in (
        ("climate", request.include_climate, safe_climate),
        ("moisture", request.include_moisture, safe_moisture),
    ):
        if enabled and request.region:
            jobs.append((name, job()))
        else:
            context[name] = {"status": "not_assessable" if enabled else "excluded"}
    if jobs:
        results = await asyncio.gather(*(job for _, job in jobs), return_exceptions=True)
        for (name, _), result in zip(jobs, results, strict=True):
            context[name] = (
                {"status": "unavailable"} if isinstance(result, BaseException) else result
            )
    return context
