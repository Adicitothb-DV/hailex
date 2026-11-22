import copy

import pytest
from pydantic import ValidationError

from app.schemas.crops import CropCatalog, ParcelProfile, ParcelValue
from app.services.crops import load_catalog


def test_endpoint_sources_and_unknown_fields(api_request):
    response = api_request("GET", "/api/v1/crops")
    assert response.status_code == 200
    result = response.json()
    assert len(result["data"]["crops"]) == 4
    sources = {source["id"] for source in result["data"]["sources"]}
    for crop in result["data"]["crops"]:
        assert crop["evidence_status"] == "provisional"
        for refs in crop["identity_source_refs"].values():
            assert refs and set(refs) <= sources
        attributes = {item["name"]: item for item in crop["attributes"]}
        for name in ("local_water_requirement", "local_planting_window"):
            assert attributes[name]["value"] is None
            assert attributes[name]["evidence_status"] == "unknown"
        assert set(attributes["product_form"]["source_refs"]) <= sources


def test_known_crop_values_require_resolvable_evidence():
    data = load_catalog().model_dump()
    no_reference = copy.deepcopy(data)
    no_reference["crops"][0]["attributes"][0]["source_refs"] = []
    with pytest.raises(ValidationError):
        CropCatalog.model_validate(no_reference)
    bad_source = copy.deepcopy(data)
    bad_source["crops"][0]["identity_source_refs"]["common_name"] = ["unknown"]
    with pytest.raises(ValidationError):
        CropCatalog.model_validate(bad_source)


def test_corrupt_or_missing_catalog_is_not_reported_as_empty(tmp_path, monkeypatch, api_request):
    from app.api.routes import crops as route

    invalid = tmp_path / "invalid.json"
    invalid.write_text("{}", encoding="utf-8")
    monkeypatch.setattr(route, "load_catalog", lambda: load_catalog(invalid))
    response = api_request("GET", "/api/v1/crops")
    assert response.status_code == 500
    assert "error" in response.json() and "data" not in response.json()


def test_parcel_unknown_and_cartographic_provenance():
    empty = ParcelProfile()
    assert empty.location is None and empty.soil_classification.value is None
    assert empty.water_regime == "unknown"
    with pytest.raises(ValidationError):
        ParcelValue(value="tipo", source="cartographic_reference", validation_status="provisional")
    parcel = ParcelProfile(
        location={"latitude": 20.6, "longitude": -100.3},
        soil_classification={
            "value": "referencia",
            "source": "cartographic_reference",
            "source_ref": "fuente-cartografica",
            "validation_status": "provisional",
        },
        water_regime="irrigated",
        water_regime_source="user_input",
        water_regime_validation="requires_validation",
    )
    assert parcel.soil_classification.source == "cartographic_reference"
    assert parcel.soil_texture.value is None
    with pytest.raises(ValidationError):
        ParcelProfile(water_regime="rainfed")
    with pytest.raises(ValidationError):
        ParcelProfile(location={"latitude": True, "longitude": -100})
