from app.analysis.rotation_engine import compare_rotation
from app.schemas.rotation_workspace import RotationInput


def test_missing_history_is_not_assessable():
    result = compare_rotation(RotationInput(prioritize_family_change=True))
    assert result["ordering"] == "not_assessable"
    assert all(option["same_family_as_previous"] is None for option in result["options"])
    assert result["forecast_status"] == "forecast_not_reliable"
    assert result["factors"]["soil"] == "not_assessable"


def test_family_change_is_only_applied_when_selected():
    result = compare_rotation(RotationInput(previous_crop="maiz_forrajero"))
    assert result["ordering"] == "not_assessable"
    result = compare_rotation(
        RotationInput(previous_crop="maiz_forrajero", prioritize_family_change=True)
    )
    assert result["options"][0]["crop_id"] == "alfalfa"
    assert result["options"][0]["same_family_as_previous"] is False
    assert all(option["same_family_as_previous"] for option in result["options"][1:])


def test_alfalfa_previous_and_unknown_water():
    result = compare_rotation(RotationInput(previous_crop="alfalfa", prioritize_family_change=True))
    assert result["options"][-1]["crop_id"] == "alfalfa"
    assert result["factors"]["water_regime"] == "not_assessable"


def test_endpoint_validates_analysis_ids_and_does_not_invent_satellite(api_request):
    assert api_request("POST", "/api/v1/rotation-workspace/compare", json={"analysis_id": "../x"}).status_code == 422
    response = api_request("POST", "/api/v1/rotation-workspace/compare", json={"analysis_id": "a" * 32})
    assert response.status_code == 200
    assert response.json()["data"]["satellite"] is None
    assert "no disponible" in response.json()["data"]["limitations"][-1]


def test_satellite_is_context_only(api_request, monkeypatch, tmp_path):
    import json

    from app.api.routes import rotation_workspace

    manifest = {
        "status": "success",
        "acquired_at": "2026-10-01",
        "indices": {"ndvi": {"mean": 0.4}, "ndmi": None},
        "valid_pixel_percent_in_aoi": None,
    }
    (tmp_path / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    monkeypatch.setattr(rotation_workspace.field_monitoring, "analysis_path", lambda _: tmp_path)
    request = {"previous_crop": "maiz_forrajero", "prioritize_family_change": True}
    baseline = api_request("POST", "/api/v1/rotation-workspace/compare", json=request).json()["data"]
    request["analysis_id"] = "b" * 32
    result = api_request("POST", "/api/v1/rotation-workspace/compare", json=request).json()["data"]
    assert result["options"] == baseline["options"]
    assert result["satellite"]["ndmi"] is None
    assert result["satellite"]["valid_pixel_percent_in_aoi"] is None
    assert result["forecast_status"] == "forecast_not_reliable"