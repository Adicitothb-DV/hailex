"""Compare prices without asserting unverified provenance or units."""

import math

import pandas as pd


def prices(row: pd.Series) -> dict:
    volume, value = row["production_volume"], row["production_value"]
    pmr, workbook = row["rural_average_price"], row["Precio_numeric"]
    derived = value / volume if pd.notna(volume) and volume > 0 and pd.notna(value) else None
    if derived is not None and not math.isfinite(derived):
        derived = None
    result = {"price_from_value_volume": derived}
    inconsistent = False
    for label, price in (("pmr", pmr), ("workbook", workbook)):
        delta = abs(price - derived) if pd.notna(price) and derived is not None else None
        relative = delta / abs(derived) if delta is not None and derived != 0 else None
        result[f"{label}_price_difference_abs"] = delta
        result[f"{label}_price_difference_rel"] = relative
        inconsistent |= delta is not None and delta > 0.005 + 1e-9
    if pd.notna(volume) and volume == 0:
        status, analytic = "unavailable_no_production", None
    elif (
        pd.isna(volume)
        or volume < 0
        or inconsistent
        or (derived is not None and derived <= 0)
        or (pd.notna(pmr) and pmr <= 0)
        or (pd.notna(workbook) and workbook <= 0)
    ):
        status, analytic = "requires_review", None
    elif pd.notna(pmr) and pmr > 0:
        status, analytic = "official_pmr", pmr
    elif pd.notna(workbook) and workbook > 0:
        status, analytic = "workbook_price_unverified", workbook
    elif derived is not None and derived > 0:
        status, analytic = "derived_from_value_volume", derived
    else:
        status, analytic = "requires_review", None
    result.update(price_status=status, analytical_price=analytic, price_inconsistent=inconsistent)
    return result
