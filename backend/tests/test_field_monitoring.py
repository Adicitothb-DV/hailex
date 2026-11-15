import json
from datetime import date

import numpy as np
import pytest
from PIL import Image

from app.services import field_monitoring as field

GEOMETRY = {
    "type": "Polygon",
    "coordinates": [
        [
            [-100.332, 20.606],
            [-100.331, 20.606],
            [-100.331, 20.607],
            [-100.332, 20.607],
            [-100.332, 20.606],
        ]
    ],
}


def test_geometry_area_and_invalid():
    area, perimeter, _ = field.validate_geometry(GEOMETRY)
    assert area == pytest.approx(1.154, rel=0.01)
    assert perimeter > 400
    for coords in (
        [[[0, 0], [1, 1], [1, 0], [0, 1], [0, 0]]],
        [[[181, 0], [181, 1], [180, 1], [181, 0]]],
        [[[0, 0], [0, 1], [1, 1]]],
    ):
        with pytest.raises(field.FieldError):
            field.validate_geometry({"type": "Polygon", "coordinates": coords})


def test_ratio_nodata_zero_denominator():
    nir = np.array([0.8, 0.0, 0.6, 0.5], dtype="float32")
    other = np.array([0.2, 0.0, 0.2, 0.5], dtype="float32")
    result = field.ratio(nir, other, np.array([True, True, False, True]))
    assert result[0] == pytest.approx(0.6)
    assert np.isnan(result[1]) and np.isnan(result[2])
    assert result[3] == 0
    assert field.statistics(result)["count"] == 2


def test_png_transparency(tmp_path):
    field.save_index(tmp_path / "index.png", np.array([[0.5, np.nan]], dtype="float32"))
    pixels = np.array(Image.open(tmp_path / "index.png"))
    assert pixels[0, 0, 3] > 0 and pixels[0, 1, 3] == 0


def test_inspection_points_quality_and_location():
    bounds = (-100.332, 20.606, -100.331, 20.607)
    values = np.linspace(0.1, 0.8, 100, dtype="float32").reshape(10, 10)
    values[0, 0] = np.nan
    result = field.inspection_points(values, GEOMETRY, bounds, 99)
    assert result["status"] == "available"
    assert 1 <= len(result["points"]) <= 3
    assert all(point["ndvi"] <= result["threshold_p20"] for point in result["points"])
    assert all(
        bounds[0] < p["longitude"] < bounds[2] and bounds[1] < p["latitude"] < bounds[3]
        for p in result["points"]
    )
    assert field.inspection_points(values, GEOMETRY, bounds, 69)["points"] == []
    assert (
        field.inspection_points(np.ones((10, 10)), GEOMETRY, bounds, 100)["status"]
        == "not_assessable"
    )
    assert (
        field.inspection_points(np.full((2, 2), np.nan), GEOMETRY, bounds, 0)["status"]
        == "not_assessable"
    )


def test_saved_analyses_api_and_missing_layers(monkeypatch, tmp_path, api_request):
    monkeypatch.setattr(field, "ROOT", tmp_path)
    directory = tmp_path / ("a" * 32)
    directory.mkdir()
    manifest = {
        "analysis_id": directory.name,
        "aoi": {"name": "Prueba"},
        "status": "success",
        "created_at": "2025-01-01T00:00:00Z",
    }
    (directory / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    assert api_request("GET", "/api/v1/fields/analyses").json()["data"] == []
    for layer in ("true-color", "ndvi", "ndmi"):
        (directory / f"{layer}.png").write_bytes(b"test")
    result = api_request("GET", "/api/v1/fields/analyses").json()["data"]
    assert len(result) == 1 and result[0]["name"] == "Prueba"
    assert (
        api_request("GET", f"/api/v1/fields/analyses/{directory.name}").json()["data"] == manifest
    )


def test_reject_untrusted_assets():
    for url in (
        "https://evil.example/a.tif",
        "http://sentinel-cogs.s3.us-west-2.amazonaws.com/a.tif",
        "https://sentinel-cogs.s3.us-west-2.amazonaws.com.evil.example/a.tif",
    ):
        with pytest.raises(field.FieldError):
            field.check_asset({"href": url, "type": "image/tiff"})


def test_validate_api_and_path_traversal(api_request):
    result = api_request("POST", "/api/v1/fields/validate", json={"geometry": GEOMETRY})
    assert result.status_code == 200
    assert result.json()["data"]["area_ha"] == pytest.approx(1.154, rel=0.01)
    assert api_request("GET", "/api/v1/fields/analyses/not-valid/layers/ndvi").status_code == 404
    assert (
        api_request("GET", "/api/v1/fields/analyses/" + "a" * 32 + "/layers/nope").status_code
        == 404
    )


def test_no_scene_and_cache(monkeypatch, tmp_path):
    monkeypatch.setattr(field, "ROOT", tmp_path)
    monkeypatch.setattr(field, "search_scenes", lambda *args: [])
    result = field.analyze(GEOMETRY, date(2025, 1, 1), date(2025, 2, 1), 40, "x", "", "")
    assert result["status"] == "no_clear_scene"
    item = {"id": "scene", "properties": {"datetime": "2025-01-01T00:00:00Z", "eo:cloud_cover": 10}}
    monkeypatch.setattr(field, "search_scenes", lambda *args: [item])
    calls = []

    def fake_grid(_item, _geometry, _bounds, resolution, names):
        calls.append(resolution)
        arrays = {
            name: np.full((2, 2), 0.4 if name == "nir" else 0.2, dtype="float32") for name in names
        }
        mask = np.array([[True, False], [True, True]])
        return arrays, mask, np.ones((2, 2), dtype=bool)

    monkeypatch.setattr(field, "process_grid", fake_grid)
    args = (GEOMETRY, date(2025, 1, 1), date(2025, 2, 1), 40, "x", "", "")
    first = field.analyze(*args)
    assert first["status"] == "success" and first["valid_pixel_percent_in_aoi"] == 75
    assert field.analyze(*args) == first
    assert calls == [10, 20]


def test_agriculture_source_and_loss(api_request):
    response = api_request("GET", "/api/v1/agriculture/series")
    assert response.status_code == 200
    data = response.json()["data"]
    if data["status"] == "source_file_missing":
        pytest.skip("Workbook not installed")
    assert data["coverage"]["total_rows"] == 155
    assert data["coverage"]["years_missing"] == list(range(2015, 2021))
    losses = [r for r in data["records"] if r["volume"] == 0]
    assert len(losses) == 2
    assert all(r["derived_value_per_volume"] is None for r in losses)
