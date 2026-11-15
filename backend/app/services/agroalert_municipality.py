"""Query and aggregate real municipal grid readings without mixing product units."""

import asyncio
import logging
from datetime import UTC, date, datetime, timedelta

from app.analysis.agroalert_geometry import municipal_grid, municipality_feature
from app.analysis.agroalert_indicators import aggregate_daily, moisture_status
from app.services.agroalert_power import NASADataError, SoilPowerClient

LOGGER = logging.getLogger(__name__)


async def query_municipality(
    client: SoilPowerClient, municipality: str, end: date, history_days: int
) -> dict:
    start = end - timedelta(days=history_days - 1)
    cells = municipal_grid(municipality)

    async def query_cell(cell: dict) -> tuple[dict, dict | None]:
        try:
            result = await client.point_series(cell["latitude"], cell["longitude"], start, end)
            return cell, result
        except NASADataError as exc:
            LOGGER.warning("Municipal NASA cell failed: %s status=%s", cell["cell_id"], exc.status)
            return cell, None

    results = await asyncio.gather(*(query_cell(cell) for cell in cells))
    failed = sum(result is None for _, result in results)
    if failed == len(cells):
        raise NASADataError()
    readings = []
    latest = []
    for cell, result in results:
        if result is None:
            continue
        meta = {
            **{
                key: cell[key]
                for key in (
                    "municipality",
                    "cell_id",
                    "sector_name",
                    "nearest_landmark",
                    "latitude",
                    "longitude",
                    "coverage_percent",
                )
            },
            **{
                key: result[key]
                for key in (
                    "source_model",
                    "unit",
                    "active_surface_parameter",
                    "active_root_parameter",
                    "used_merra_fallback",
                    "baseline_start",
                )
            },
        }
        cell_rows = [{**row, **meta} for row in result["rows"]]
        readings.extend(cell_rows)
        usable = [
            row
            for row in cell_rows
            if row[result["active_surface_parameter"]] is not None
            or row[result["active_root_parameter"]] is not None
        ]
        if usable:
            row = usable[-1]
            status, interpretation = moisture_status(row["RZMC_PRCNTL"])
            latest.append({**row, "status": status, "interpretation": interpretation})
    readings.sort(key=lambda row: (row["cell_id"], row["date"]))
    daily = aggregate_daily(readings)
    for row in daily:
        row["status"], row["interpretation"] = moisture_status(row["RZMC_PRCNTL"])
    return {
        "municipality": municipality,
        "boundary": municipality_feature(municipality),
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "retrieved_at": datetime.now(UTC).isoformat(),
        "cells": cells,
        "cell_readings": readings,
        "latest_by_cell": latest,
        "daily": daily,
        "failed_cell_count": failed,
        "successful_cell_count": len(cells) - failed,
        "data_type": "satellite_modelled",
    }
