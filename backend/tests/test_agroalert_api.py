import asyncio
from datetime import date

from fastapi.testclient import TestClient

from app.analysis.agroalert_geometry import municipal_grid
from app.main import create_app
from app.services.agroalert_municipality import query_municipality
from app.services.agroalert_power import NASADataError


class FakeSoilPower:
    def __init__(self, fail_first=False):
        self.calls = []
        self.fail_first = fail_first

    async def point_series(self, lat, lon, start, end):
        self.calls.append((lat, lon, start, end))
        if self.fail_first and len(self.calls) == 1:
            raise NASADataError()
        return {
            "rows": [
                {
                    "date": end.isoformat(),
                    "SFMC": 0.2,
                    "RZMC": None,
                    "GWETTOP": None,
                    "GWETROOT": None,
                    "SFMC_PRCNTL": 30,
                    "RZMC_PRCNTL": None,
                }
            ],
            "source_model": "SMAP L4 (NASA POWER)",
            "unit": "m³/m³",
            "active_surface_parameter": "SFMC",
            "active_root_parameter": "RZMC",
            "used_merra_fallback": False,
            "baseline_start": "2025-01-01",
        }


def test_municipality_partial_and_center_query():
    fake = FakeSoilPower(fail_first=True)
    result = asyncio.run(query_municipality(fake, "El Marqués", date(2026, 1, 1), 30))
    assert result["failed_cell_count"] == 1
    assert result["successful_cell_count"] == len(municipal_grid("El Marqués")) - 1
    assert {(call[0], call[1]) for call in fake.calls} == {
        (cell["latitude"], cell["longitude"]) for cell in result["cells"]
    }
    assert result["latest_by_cell"][0]["status"] == "Sin dato"
    assert result["daily"][0]["SFMC"] == 0.2


def test_endpoints_validation_and_envelope():
    app = create_app()
    app.state.soil_power = FakeSoilPower()
    with TestClient(app) as client:
        response = client.get("/api/v1/agroalert/municipalities")
        assert response.status_code == 200
        assert len(response.json()["data"]["collection"]["features"]) == 18
        response = client.get(
            "/api/v1/agroalert/moisture",
            params={"municipality": "Colón", "end_date": "2026-01-01", "history_days": 30},
        )
        assert response.status_code == 200
        assert response.json()["data"]["municipality"] == "Colón"
        assert (
            client.get(
                "/api/v1/agroalert/moisture",
                params={"municipality": "Querétaro", "end_date": "2026-01-01"},
            ).status_code
            == 422
        )
