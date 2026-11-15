import pytest

from app.services.agroalert_power import NASADataError
from app.services.agroalert_regional import normalize_bounds, parse_regional_csv


def test_bounds_expand_even_near_poles_and_reject_invalid():
    south, north, west, east = normalize_bounds(89.9, 90, -100, -99.9)
    assert north <= 90 and north - south == pytest.approx(2.05)
    assert east - west == pytest.approx(2.05)
    with pytest.raises(ValueError):
        normalize_bounds(0, 11, 0, 1)
    with pytest.raises(ValueError):
        normalize_bounds(10, 0, 0, 1)


def test_csv_header_alias_and_date_formats():
    text = "-BEGIN HEADER-\nNASA\n-END HEADER-\nLATITUDE,LONGITUDE,YEAR,MO,DY,SFMC\n20,-100,2026,1,2,0.2\n21,-100,2026,1,3,-999\n"
    assert parse_regional_csv(text, "SFMC") == [
        {"date": "2026-01-02", "lat": 20, "lon": -100, "SFMC": 0.2}
    ]
    doy = "description\nLAT,LON,YEAR,DOY,GWETTOP\n20,-100,2024,60,0.8\n"
    assert parse_regional_csv(doy, "GWETTOP")[0]["date"] == "2024-02-29"
    with pytest.raises(NASADataError):
        parse_regional_csv("LAT,LON,SFMC\n20,-100,-999", "SFMC")
