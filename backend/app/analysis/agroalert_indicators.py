"""Pure scientific transformations for AgroAlert; no missing-value imputation."""

import math
from collections import defaultdict

import pandas as pd

PARAMETERS = ("SFMC", "RZMC", "GWETTOP", "GWETROOT")
PERCENTILES = ("SFMC_PRCNTL", "RZMC_PRCNTL")


def clean_value(value: object) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError, OverflowError):
        return None
    return number if math.isfinite(number) and number > -900 else None


def moisture_status(percentile: float | None) -> tuple[str, str]:
    if percentile is None or not math.isfinite(percentile):
        return (
            "Sin dato",
            "No hay suficientes registros para comparar con el periodo de referencia.",
        )
    if percentile < 10:
        return (
            "Muy baja",
            "Mucho más seco respecto a la referencia; revisar las condiciones en campo.",
        )
    if percentile < 25:
        return "Baja", "Menos humedad respecto a la referencia; vigilar las condiciones en campo."
    if percentile < 40:
        return "Moderada-baja", "Ligeramente por debajo del rango medio de referencia."
    if percentile <= 60:
        return "Normal", "Dentro del rango medio de la referencia disponible."
    return "Alta", "Por encima del rango medio de la referencia disponible."


def attach_percentiles(rows: list[dict], surface: str, root: str) -> list[dict]:
    """Rank each variable independently over the available baseline, ties averaged."""
    result = [dict(row) for row in rows]
    for variable, output in ((surface, PERCENTILES[0]), (root, PERCENTILES[1])):
        values = pd.Series([clean_value(row.get(variable)) for row in result], dtype="float64")
        ranks = values.rank(method="average", pct=True) * 100 if values.notna().sum() >= 5 else None
        for index, row in enumerate(result):
            rank = None if ranks is None else clean_value(ranks.iloc[index])
            row[output] = round(rank, 1) if rank is not None else None
    return result


def weighted_mean(rows: list[dict], field: str) -> float | None:
    values = [
        (clean_value(row.get(field)), clean_value(row.get("coverage_percent"))) for row in rows
    ]
    weighted = [
        (value, weight)
        for value, weight in values
        if value is not None and weight is not None and weight > 0
    ]
    if weighted:
        value = sum(item * weight for item, weight in weighted) / sum(
            weight for _, weight in weighted
        )
    else:
        valid = [item for item, _ in values if item is not None]
        if not valid:
            return None
        value = sum(valid) / len(valid)
    return round(value, 1 if field.endswith("_PRCNTL") else 4)


def aggregate_daily(rows: list[dict]) -> list[dict]:
    """Keep sources distinct, including their percentile reference populations."""
    grouped: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for row in rows:
        grouped[(row["date"], row["source_model"])].append(row)
    return [
        {
            "date": day,
            "source_model": source,
            **{field: weighted_mean(group, field) for field in PARAMETERS + PERCENTILES},
        }
        for (day, source), group in sorted(grouped.items())
    ]
