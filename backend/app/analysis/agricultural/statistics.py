"""Pure statistical primitives; never authorize training on their own."""

import math

import numpy as np
import pandas as pd


def deflate(price: float, index: float, base_index: float) -> float:
    if not all(math.isfinite(x) and x > 0 for x in (price, index, base_index)):
        raise ValueError("Price and indices must be finite and positive")
    return price * base_index / index


def inflate(real: float, index: float, base_index: float) -> float:
    return deflate(real, base_index, index)


def weighted_price(value: pd.Series, volume: pd.Series) -> float | None:
    if value.isna().any() or volume.isna().any() or (volume < 0).any() or (value < 0).any():
        return None
    if not np.isfinite(value).all() or not np.isfinite(volume).all() or volume.sum() <= 0:
        return None
    if ((volume == 0) & (value != 0)).any():
        return None
    return float(value.sum() / volume.sum())


def metrics(actual: np.ndarray, predicted: np.ndarray) -> dict:
    actual, predicted = np.asarray(actual, dtype=float), np.asarray(predicted, dtype=float)
    if (
        actual.shape != predicted.shape
        or not actual.size
        or not np.isfinite(actual).all()
        or not np.isfinite(predicted).all()
    ):
        raise ValueError("Metrics require equal, nonempty finite arrays")
    diff = np.abs(actual - predicted)
    denom = np.abs(actual) + np.abs(predicted)
    return {
        "mae": float(diff.mean()),
        "rmse": float(np.sqrt(np.mean(diff**2))),
        "wape": float(diff.sum() / np.abs(actual).sum()) if np.abs(actual).sum() else None,
        "smape": float(np.mean(2 * diff[denom > 0] / denom[denom > 0]))
        if (denom > 0).any()
        else None,
    }


def expanding_year_splits(years: list[int], minimum_train_years: int = 5):
    """Yield whole-year partitions, not a claim that historical data were available."""
    ordered = sorted(set(years))
    for i in range(minimum_train_years, len(ordered)):
        yield ordered[:i], ordered[i]


def persistence(history: pd.Series) -> float:
    valid = history.dropna()
    if valid.empty:
        raise ValueError("No history")
    return float(valid.iloc[-1])


def drift(years: np.ndarray, values: np.ndarray, target: int) -> float:
    if len(years) < 2 or len(set(years)) != len(years) or target <= max(years):
        raise ValueError("Drift requires distinct history years and a future target")
    coef = np.polyfit(years, values, 1)
    return float(np.polyval(coef, target))
