import asyncio
from datetime import date

from fastapi.testclient import TestClient

from app.analysis.pest_monitor import evaluate, sectors
from app.main import create_app
from app.services.agroalert_power import NASADataError
from app.services.pest_monitor import weather_by_sector


def test_evaluation_missing_values_and_crop_filter():
    result = evaluate({"temp": 24, "rh": 55, "rain7d": 12, "soil": None}, ["maiz"], "ALL")
    assert result["data_type"] == "simulation"
    assert result["overall"] is None
    assert next(p for p in result["pests"] if p["id"] == "gallina")["status"] == "not_assessable"
    assert all("brocoli" in p["crops"] for p in evaluate({}, [], "brocoli")["pests"])


def test_sector_geometry_and_complete_scenario():
    for name in ("El Marqués", "Colón"):
        result = sectors(name)
        assert len(result) == (6 if name == "El Marqués" else 5)
        assert all(s["geometry"] is not None for s in result)
        evaluation = evaluate(
            {"temp": 24, "rh": 55, "rain7d": 12, "soil": 45}, result[0]["crops"], "ALL"
        )
        assert evaluation["overall"] is not None
        assert all(0 <= p["score"] <= 100 for p in evaluation["pests"])


class FakePower:
    async def point_parameters(self, lat, lon, start, end, parameters):
        if lat == 20.771:
            raise NASADataError()
        return [
            {
                "date": date(2026, 1, i).isoformat(),
                "T2M": 22,
                "RH2M": 50,
                "PRECTOTCORR": 2,
                "GWETTOP": 0.4,
            }
            for i in range(1, 9)
        ]


def test_weather_missing_and_seven_day_sum():
    result = asyncio.run(weather_by_sector(FakePower(), "El Marqués"))
    assert next(r for r in result if r["id"] == "2")["error"]
    assert result[0]["rain7d"] == 14
    assert result[0]["soil"] == 40


def test_routes_validate_and_expose_simulation():
    app = create_app()
    app.state.soil_power = FakePower()
    with TestClient(app) as client:
        response = client.get("/api/v1/agroalert/pests/sectors", params={"municipality": "Colón"})
        assert response.status_code == 200
        assert response.json()["data"]["data_type"] == "simulation"
        response = client.post(
            "/api/v1/agroalert/pests/evaluate",
            json={"municipality": "Colón", "crop": "maiz", "weather": {"0": {"temp": 24}}},
        )
        assert response.status_code == 200
        assert response.json()["data"]["sectors"][0]["overall"] is None
        assert (
            client.post(
                "/api/v1/agroalert/pests/evaluate",
                json={"municipality": "Colón", "weather": {"0": {"rh": 101}}},
            ).status_code
            == 422
        )
