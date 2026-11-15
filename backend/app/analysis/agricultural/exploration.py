"""Descriptive-only annual series, keeping price origins strictly separated."""

import numpy as np
import pandas as pd

KEY = [
    "region_id",
    "municipality_name",
    "crop_name",
    "crop_product_form",
    "agricultural_cycle",
    "irrigation_mode",
]


def annual(panel: pd.DataFrame) -> pd.DataFrame:
    required = KEY + [
        "year",
        "quality_status",
        "price_status",
        "Preciomediorural",
        "Precio",
        "price_from_value_volume",
        "production_volume",
        "production_value",
    ]
    missing = sorted(set(required) - set(panel.columns))
    if missing:
        raise ValueError(f"Missing required fields: {missing}")
    if panel.duplicated(KEY + ["year"]).any():
        raise ValueError("Duplicate analytical keys; no silent aggregation")
    frame = panel.copy().sort_values(KEY + ["year"]).reset_index(drop=True)
    frame["price_real"] = np.nan
    frame["price_real_status"] = "unavailable_no_verified_deflator_or_units"
    frame["price_nominal_raw_units_unverified"] = frame["analytical_price"]
    frame["yoy_price_pct"] = np.nan
    for measure in (
        "planted_area",
        "harvested_area",
        "damaged_area",
        "production_volume",
        "reported_yield",
    ):
        frame[f"{measure}_yoy_pct"] = np.nan
    for _, positions in frame.groupby(KEY, dropna=False).groups.items():
        group = frame.loc[positions]
        previous = group["price_nominal_raw_units_unverified"].shift()
        same_source = group["price_status"].eq(group["price_status"].shift())
        consecutive = group["year"].sub(group["year"].shift()).eq(1)
        mask = (
            same_source
            & consecutive
            & previous.gt(0)
            & group["price_nominal_raw_units_unverified"].notna()
        )
        frame.loc[group.index[mask], "yoy_price_pct"] = 100 * (
            group.loc[mask, "price_nominal_raw_units_unverified"] / previous[mask] - 1
        )
        for measure in (
            "planted_area",
            "harvested_area",
            "damaged_area",
            "production_volume",
            "reported_yield",
        ):
            if measure not in group:
                continue
            previous_measure = group[measure].shift()
            valid = consecutive & previous_measure.gt(0) & group[measure].notna()
            frame.loc[group.index[valid], f"{measure}_yoy_pct"] = 100 * (
                group.loc[valid, measure] / previous_measure[valid] - 1
            )
    return frame
