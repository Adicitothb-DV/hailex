"""Checks on the unmodified local source boundaries and clipped grid."""

import pytest
from shapely.geometry import Point, box, shape

from app.analysis.agroalert_geometry import (
    STEP,
    load_municipalities,
    municipal_grid,
    municipality_feature,
)


def test_collection_and_target_boundaries():
    assert len(load_municipalities()["features"]) == 18
    a = shape(municipality_feature("El Marqués")["geometry"])
    b = shape(municipality_feature("Colón")["geometry"])
    assert a.is_valid and b.is_valid
    assert a.intersection(b).area == 0
    with pytest.raises(ValueError):
        municipality_feature("Querétaro")


@pytest.mark.parametrize("name", ["El Marqués", "Colón"])
def test_grid_is_clipped_aligned_and_labels_are_inside(name):
    polygon = shape(municipality_feature(name)["geometry"])
    cells = municipal_grid(name)
    assert cells
    assert cells == sorted(cells, key=lambda cell: (-cell["latitude"], cell["longitude"]))
    for cell in cells:
        lat, lon = cell["latitude"], cell["longitude"]
        assert lat / STEP == pytest.approx(round(lat / STEP))
        assert lon / STEP == pytest.approx(round(lon / STEP))
        clipped = shape(cell["clipped_geometry"])
        assert clipped.difference(polygon).area == pytest.approx(0, abs=1e-12)
        assert clipped.covers(Point(cell["label_longitude"], cell["label_latitude"]))
        square = box(lon - STEP / 2, lat - STEP / 2, lon + STEP / 2, lat + STEP / 2)
        assert cell["coverage_percent"] == pytest.approx(100 * clipped.area / square.area)
        assert cell["coverage_percent"] >= 5
