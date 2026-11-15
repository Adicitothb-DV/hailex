"""Flag suspect rows; retain them in observations but exclude rejects from summaries."""

from collections import Counter

import numpy as np
import pandas as pd

from .normalize_siap import ALIASES, CROPS, MUNICIPALITIES

KEY = ["Idestado", "Idmunicipio", "Anio", "Idcultivo", "Idciclo", "Idmodalidad"]
MEASURES = [
    "Sembrada",
    "Cosechada",
    "Siniestrada",
    "Volumenproduccion",
    "Rendimiento",
    "Preciomediorural",
    "Precio",
    "Valorproduccion",
]
IDS = {
    "Nommunicipio": ("Idmunicipio", {"Colón": 5, "El Marqués": 11}),
    "Nomcultivo": (
        "Idcultivo",
        {
            "Alfalfa verde": 5170000,
            "Cebada grano": 5920000,
            "Maíz forrajero en verde": 7470000,
            "Sorgo forrajero en verde": 8790000,
        },
    ),
    "Nomcicloproductivo": ("Idciclo", {"Otoño-Invierno": 1, "Primavera-Verano": 2, "Perennes": 3}),
    "Nommodalidad": ("Idmodalidad", {"Riego": 1, "Temporal": 2}),
}


def validate(frame: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    out = frame.copy()
    duplicate = out.duplicated(KEY, keep=False)
    flags, statuses = [], []
    for idx, row in out.iterrows():
        errors, warnings = [], []
        if duplicate.loc[idx]:
            errors.append("duplicate_key")
        if row["Nommunicipio"] not in MUNICIPALITIES:
            errors.append("unknown_municipality")
        if row["Nomcultivo"] not in CROPS:
            errors.append("unknown_crop")
        if row["Nomcicloproductivo"] not in ("Otoño-Invierno", "Primavera-Verano", "Perennes"):
            errors.append("unknown_cycle")
        if row["Nommodalidad"] not in ("Riego", "Temporal"):
            errors.append("unknown_irrigation")
        if row["Idestado"] != 22:
            errors.append("unknown_state")
        for name, (id_column, mapping) in IDS.items():
            if row[name] in mapping and row[id_column] != mapping[row[name]]:
                errors.append(f"id_name_mismatch:{name}")
        for name in ALIASES:
            value = row[name]
            if pd.notna(value):
                number = pd.to_numeric(value, errors="coerce")
                if pd.isna(number) or not np.isfinite(number):
                    errors.append(f"invalid_numeric:{name}")
                elif number < 0:
                    errors.append(f"negative:{name}")
        for name in KEY:
            value = pd.to_numeric(row[name], errors="coerce")
            if pd.isna(value) or not np.isfinite(value) or value != int(value):
                errors.append(f"invalid_key:{name}")
        for name in (
            "Sembrada",
            "Cosechada",
            "Siniestrada",
            "Volumenproduccion",
            "Valorproduccion",
        ):
            if pd.isna(row[name]):
                warnings.append(f"missing:{name}")
        planted, harvested, damaged = (
            row["planted_area"],
            row["harvested_area"],
            row["damaged_area"],
        )
        volume, yld = row["production_volume"], row["reported_yield"]
        if (
            all(pd.notna(x) for x in (planted, harvested, damaged))
            and harvested + damaged > planted + 1e-8
        ):
            warnings.append("surface_inconsistent")
        if pd.notna(volume) and volume > 0 and pd.notna(harvested) and harvested == 0:
            warnings.append("production_without_harvest")
        if pd.notna(volume) and pd.notna(harvested) and harvested > 0 and pd.notna(yld):
            if abs(yld - volume / harvested) > 0.005 + 1e-9:
                warnings.append("yield_inconsistent")
        if row["price_inconsistent"]:
            warnings.append("price_inconsistent")
        if pd.notna(volume) and volume == 0:
            warnings.append("zero_production_price_unavailable")
        if row["price_status"] == "requires_review":
            warnings.append("price_requires_review")
        statuses.append("rejected" if errors else "warning" if warnings else "accepted")
        flags.append(";".join(errors + warnings))
    out["quality_status"], out["quality_flags"] = statuses, flags
    reasons = Counter(flag for flags_row in flags for flag in flags_row.split(";") if flag)
    years = sorted({int(v) for v in out["year"].dropna() if float(v).is_integer()})
    report = {
        "total_rows": len(out),
        "accepted": statuses.count("accepted"),
        "warnings": statuses.count("warning"),
        "rejected": statuses.count("rejected"),
        "reasons": dict(sorted(reasons.items())),
        "missing_fields": {
            col: int(out[col].isna().sum()) for col in frame.columns if col not in ALIASES.values()
        },
        "years_present": years,
        "years_missing_within_range": sorted(set(range(min(years), max(years) + 1)) - set(years))
        if years
        else [],
        "distributions": {
            col: {str(k): int(v) for k, v in out[col].value_counts(dropna=False).items()}
            for col in ("Anio", "Nomcultivo", "Nommunicipio", "Nommodalidad", "Nomcicloproductivo")
        },
    }
    return out, report
