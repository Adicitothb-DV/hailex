"""Produce explicitly provisional summaries without averaging unit prices."""

import pandas as pd

MEASURES = [
    "planted_area",
    "harvested_area",
    "damaged_area",
    "production_volume",
    "production_value",
]
BASE = [
    "region_id",
    "municipality_id",
    "municipality_name",
    "crop_id",
    "crop_name",
    "crop_product_form",
    "year",
]


def aggregate(observations: pd.DataFrame, *, collapse_cycles: bool) -> pd.DataFrame:
    keys = BASE if collapse_cycles else BASE + ["agricultural_cycle", "irrigation_mode"]
    records = []
    # Rejected rows remain in observations and suppress the entire affected group.
    for key, group in observations.groupby(keys, dropna=False, sort=True):
        record = dict(zip(keys, key, strict=True))
        record["row_count"] = len(group)
        safe = (group["quality_status"] != "rejected").all()
        safe &= group["region_id"].notna().all() and group["crop_name"].notna().all()
        safe &= (
            group["agricultural_cycle"]
            .isin(["Otoño-Invierno", "Primavera-Verano", "Perennes"])
            .all()
        )
        safe &= group["irrigation_mode"].isin(["Riego", "Temporal"]).all()
        safe &= group["Nomunidad"].notna().all() and group["Nomunidad"].nunique() == 1
        safe &= group["Idunidadmedida"].notna().all() and group["Idunidadmedida"].nunique() == 1
        safe &= group[MEASURES].notna().all().all()
        safe &= (
            not group["quality_flags"]
            .str.contains(
                "surface_inconsistent|production_without_harvest|price_inconsistent|price_requires_review",
                regex=True,
            )
            .any()
        )
        for column in MEASURES:
            record[column] = group[column].sum() if safe else None
        volume, value = record["production_volume"], record["production_value"]
        record["price_from_value_volume"] = value / volume if safe and volume > 0 else None
        record["aggregation_status"] = "provisional_units_unverified" if safe else "requires_review"
        record["production_unit_raw"] = group["Nomunidad"].iloc[0] if safe else None
        record["dimensions_collapsed"] = "cycle;irrigation" if collapse_cycles else "none"
        records.append(record)
    return pd.DataFrame.from_records(
        records,
        columns=keys
        + [
            "row_count",
            *MEASURES,
            "price_from_value_volume",
            "aggregation_status",
            "production_unit_raw",
            "dimensions_collapsed",
        ],
    )
