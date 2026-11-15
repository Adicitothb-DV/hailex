"""Fetch daily NASA POWER observations without replacing missing values."""

import asyncio
from datetime import UTC, datetime, timedelta

from app.analysis.pest_monitor import sectors
from app.services.agroalert_power import NASADataError


async def weather_by_sector(client, municipality: str) -> list[dict]:
    end = datetime.now(UTC).date() - timedelta(days=4)
    start = end - timedelta(days=9)

    async def query(sector):
        try:
            rows = await client.point_parameters(
                sector["lat"], sector["lon"], start, end, ("T2M", "RH2M", "PRECTOTCORR", "GWETTOP")
            )
        except NASADataError:
            return {"id": sector["id"], "error": "NASA POWER no disponible"}
        latest = next((r for r in reversed(rows) if r.get("T2M") is not None), None)
        if latest is None:
            return {"id": sector["id"], "error": "Sin temperatura disponible"}
        day = datetime.fromisoformat(latest["date"]).date()
        rain_rows = {r["date"]: r.get("PRECTOTCORR") for r in rows}
        rain = [rain_rows.get((day - timedelta(days=i)).isoformat()) for i in range(7)]
        soil = latest.get("GWETTOP")
        return {
            "id": sector["id"],
            "date": latest["date"],
            "temp": latest.get("T2M"),
            "rh": latest.get("RH2M"),
            "rain7d": round(sum(rain), 1) if all(v is not None and v >= 0 for v in rain) else None,
            "soil": soil * 100 if soil is not None and 0 <= soil <= 1 else None,
            "data_type": "satellite_modelled",
        }

    return await asyncio.gather(*(query(s) for s in sectors(municipality)))
