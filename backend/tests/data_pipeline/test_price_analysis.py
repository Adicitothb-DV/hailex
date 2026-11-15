import numpy as np
import pandas as pd
import pytest

from app.analysis.agricultural.exploration import annual
from app.analysis.agricultural.statistics import (
    deflate,
    drift,
    expanding_year_splits,
    inflate,
    metrics,
    persistence,
    weighted_price,
)


def test_deflator_roundtrip_and_zero():
    assert deflate(100, 120, 100) == pytest.approx(83.3333333)
    assert inflate(deflate(100, 120, 100), 120, 100) == pytest.approx(100)
    with pytest.raises(ValueError):
        deflate(100, 0, 100)


def test_weighted_price_and_zero_volume():
    assert weighted_price(pd.Series([100, 600]), pd.Series([20, 60])) == 8.75
    assert weighted_price(pd.Series([0]), pd.Series([0])) is None
    assert weighted_price(pd.Series([1]), pd.Series([0])) is None


def test_splits_baselines_and_metrics():
    assert list(expanding_year_splits([2021, 2003, 2004, 2005], 2)) == [
        ([2003, 2004], 2005),
        ([2003, 2004, 2005], 2021),
    ]
    assert persistence(pd.Series([1, 2, None])) == 2
    assert drift(np.array([2000, 2002]), np.array([10, 14]), 2003) == pytest.approx(16)
    assert metrics(np.array([1, 3]), np.array([2, 1]))["mae"] == 1.5
    assert metrics(np.array([0]), np.array([0]))["wape"] is None


def test_variation_only_consecutive_same_provenance():
    base = {
        "region_id": "r",
        "municipality_name": "m",
        "crop_name": "c",
        "crop_product_form": "grano",
        "agricultural_cycle": "OI",
        "irrigation_mode": "Riego",
        "quality_status": "accepted",
        "Preciomediorural": 10,
        "Precio": None,
        "price_from_value_volume": 10,
        "production_volume": 1,
        "production_value": 10,
    }
    rows = [
        base | {"year": 2013, "price_status": "workbook_price_unverified", "analytical_price": 10},
        base | {"year": 2014, "price_status": "workbook_price_unverified", "analytical_price": 20},
        base | {"year": 2021, "price_status": "official_pmr", "analytical_price": 30},
    ]
    result = annual(pd.DataFrame(rows))
    assert result.loc[1, "yoy_price_pct"] == 100
    assert pd.isna(result.loc[2, "yoy_price_pct"])
    assert result["price_real"].isna().all()
    with pytest.raises(ValueError):
        annual(pd.DataFrame(rows + [rows[0]]))
