"""Agricultural-period features from verified daily POWER snapshots."""

import json
from datetime import date

import numpy as np
import pandas as pd

from app.services.power import PARAMETERS

CALENDAR_SOURCE = "https://nube.agricultura.gob.mx/calendario_agricola/"
PRECIP_SOURCE = "https://www.climdex.org/learn/indices/"


def period(year: int, cycle: str, crop: str) -> tuple[date, date] | None:
    if cycle == "Otoño-Invierno":
        return date(year - 1, 10, 1), date(year, 9, 30)
    if cycle == "Primavera-Verano":
        return date(year, 3, 1), date(year + 1, 3, 31)
    if cycle == "Perennes" and crop == "alfalfa":
        return date(year - 1, 10, 1), date(year, 9, 30)
    return None


def features(daily: pd.DataFrame, region: str, year: int, cycle: str, crop: str) -> dict:
    result = {
        "region_id": region,
        "year": year,
        "agricultural_cycle": cycle,
        "crop_name": crop,
        "calendar_method": "national_statistical_window_approximate",
        "calendar_source": CALENDAR_SOURCE,
        "local_calendar_id": None,
        "stage": "full_statistical_window_not_crop_phenology",
    }
    window = period(year, cycle, crop)
    if window is None:
        result["climate_status"] = "calendar_not_assessable"
        return result
    start, end = window
    dates = pd.date_range(start, end, freq="D")
    subset = daily.loc[daily["region_id"] == region].set_index("date").reindex(dates)
    result.update(
        period_start=start.isoformat(),
        period_end=end.isoformat(),
        expected_days=len(dates),
        time_standard="UTC",
        precipitation_threshold_mm=1.0,
    )
    for key in PARAMETERS:
        series = pd.to_numeric(subset[key], errors="coerce")
        valid = int(series.notna().sum())
        result[f"{key}_valid_days"] = valid
        result[f"{key}_missing_days"] = len(dates) - valid
        result[f"{key}_coverage_pct"] = 100 * valid / len(dates)
        result[f"{key}_missing_pct"] = 100 * (len(dates) - valid) / len(dates)
    t, p, solar = (pd.to_numeric(subset[key], errors="coerce") for key in PARAMETERS)
    # Do not present incomplete sums or extrema as representative of full periods.
    if t.notna().all():
        result.update(
            t2m_mean_c=t.mean(),
            t2m_min_daily_mean_c=t.min(),
            t2m_max_daily_mean_c=t.max(),
            t2m_p10_daily_mean_c=t.quantile(0.1),
            t2m_p90_daily_mean_c=t.quantile(0.9),
        )
    if p.notna().all() and (p >= 0).all():
        dry = p < 1
        runs = dry.groupby((dry != dry.shift()).cumsum()).sum()
        monthly = p.groupby(p.index.strftime("%Y-%m")).sum().round(6).to_dict()
        result.update(
            precip_total_mm=p.sum(),
            precip_wet_days_ge_1mm=int((p >= 1).sum()),
            precip_max_consecutive_dry_days_lt_1mm=int(runs.max()),
            precip_monthly_mm_json=json.dumps(monthly, sort_keys=True, separators=(",", ":")),
        )
    if solar.notna().all() and (solar >= 0).all():
        result.update(solar_mean_mj_m2_day=solar.mean(), solar_sum_mj_m2=solar.sum())
    result["climate_status"] = (
        "complete_approximate"
        if all(result[f"{key}_missing_days"] == 0 for key in PARAMETERS)
        else "incomplete"
    )
    if (p.dropna() < 0).any() or (solar.dropna() < 0).any():
        result["climate_status"] = "invalid_physical_values"
    result["data_type"] = "derived"
    return result


def add_scenarios(frame: pd.DataFrame) -> pd.DataFrame:
    """Retrospective terciles: exploratory, not forecasts; avoid leakage in modelling."""
    frame = frame.copy()
    for column in ("precip_total_mm", "t2m_mean_c"):
        if column not in frame:
            frame[column] = np.nan
    frame["precip_scenario_exploratory"] = None
    frame["temperature_scenario_exploratory"] = None
    frame["scenario_reference_count"] = 0
    for _, indexes in frame.groupby(
        ["region_id", "agricultural_cycle", "crop_name"]
    ).groups.items():
        subset = frame.loc[indexes]
        valid = subset[
            (subset["climate_status"] == "complete_approximate")
            & subset["precip_total_mm"].notna()
            & subset["t2m_mean_c"].notna()
        ]
        frame.loc[indexes, "scenario_reference_count"] = len(valid)
        if len(valid) < 10:
            continue
        for col, target, labels in (
            ("precip_total_mm", "precip_scenario_exploratory", ("more_dry", "normal", "more_wet")),
            ("t2m_mean_c", "temperature_scenario_exploratory", ("cooler", "normal", "warmer")),
        ):
            lo, hi = valid[col].quantile([1 / 3, 2 / 3])
            frame.loc[valid.index, target] = np.where(
                valid[col] < lo, labels[0], np.where(valid[col] > hi, labels[2], labels[1])
            )
    return frame
