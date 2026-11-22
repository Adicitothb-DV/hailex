import json

import pytest
from shapely.geometry import Polygon, mapping, shape

from app.analysis.agroalert_geometry import DATA_FILE, municipality_feature
from app.services.agroalert_boundaries import parse_nominatim, parse_overpass, update, validate


def densify(polygon):
    coordinates = list(polygon.exterior.coords)
    result = []
    for a, b in zip(coordinates[:-1], coordinates[1:], strict=True):
        result.extend(
            [(a[0] + (b[0] - a[0]) * i / 30, a[1] + (b[1] - a[1]) * i / 30) for i in range(30)]
        )
    result.append(coordinates[-1])
    return Polygon(result)


def test_atomic_update_preserves_other_features(tmp_path):
    # Dense polygons in this test are synthetic fixtures, never production data.
    path = tmp_path / "municipios.geojson"
    path.write_bytes(DATA_FILE.read_bytes())
    original = json.loads(path.read_text(encoding="utf-8"))
    geometries = {}
    for name, code in [("El Marqués", "22011"), ("Colón", "22005")]:
        geom = shape(municipality_feature(name)["geometry"])
        geometries[code] = geom if len(geom.exterior.coords) >= 500 else densify(geom)
    validate(geometries)
    update(geometries, path)
    changed = json.loads(path.read_text(encoding="utf-8"))
    assert len(changed["features"]) == 18
    assert (tmp_path / "municipios.backup.geojson").read_bytes() == DATA_FILE.read_bytes()
    assert [f for f in changed["features"] if f["properties"]["cvegeo"] not in geometries] == [
        f for f in original["features"] if f["properties"]["cvegeo"] not in geometries
    ]
    saved = path.read_bytes()
    with pytest.raises(ValueError):
        update({"22011": geometries["22011"]}, path)
    assert path.read_bytes() == saved


def test_boundary_parsers():
    poly = shape(municipality_feature("El Marqués")["geometry"])
    payload = {
        "features": [
            {"properties": {"osm_type": "relation", "osm_id": 5605767}, "geometry": mapping(poly)}
        ]
    }
    assert parse_nominatim(payload)["22011"].equals(poly)
    coords = list(poly.exterior.coords)
    middle = len(coords) // 2
    members = [
        {"type": "way", "role": "outer", "geometry": [{"lon": x, "lat": y} for x, y in segment]}
        for segment in (coords[: middle + 1], coords[middle:])
    ]
    assert parse_overpass({"elements": [{"type": "relation", "id": 5605767, "members": members}]})[
        "22011"
    ].equals(poly)
