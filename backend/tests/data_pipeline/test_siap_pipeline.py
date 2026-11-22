"""Synthetic fixtures only; no network or production workbook required."""

import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from scripts.data_pipeline.aggregate_siap import aggregate
from scripts.data_pipeline.load_siap import load_workbook
from scripts.data_pipeline.normalize_siap import normalize
from scripts.data_pipeline.run_siap_pipeline import run
from scripts.data_pipeline.validate_siap import validate


def record(**changes):
    row = {
        "Anio": 2021,
        "Idestado": 22,
        "Nomestado": "Querétaro",
        "Idddr": 120,
        "Nomddr": "Cadereyta",
        "Idcader": 2,
        "Nomcader": "Colón",
        "Idmunicipio": 5,
        "Nommunicipio": "Colón",
        "Idciclo": 1,
        "Nomcicloproductivo": "Otoño-Invierno",
        "Idmodalidad": 1,
        "Nommodalidad": "Riego",
        "Idunidadmedida": 200201,
        "Nomunidad": "Tonelada",
        "Idcultivo": 5920000,
        "Nomcultivo": "Cebada grano",
        "Sembrada": 10,
        "Cosechada": 10,
        "Siniestrada": 0,
        "Volumenproduccion": 20,
        "Rendimiento": 2,
        "Preciomediorural": 5,
        "Valorproduccion": 100,
        "Precio": None,
    }
    row.update(changes)
    return row


def workbook(path: Path, rows: list[dict]) -> None:
    pd.DataFrame(rows).to_excel(path, sheet_name="Consolidado", index=False, engine="openpyxl")


def test_xlsx_hash_required_columns_and_immutability(tmp_path):
    source = tmp_path / "source.xlsx"
    workbook(source, [record()])
    before = source.read_bytes()
    frame, digest = load_workbook(source)
    assert digest == hashlib.sha256(before).hexdigest()
    assert frame.loc[0, "source_row"] == 2
    assert source.read_bytes() == before
    workbook(source, [{k: v for k, v in record().items() if k != "Precio"}])
    with pytest.raises(ValueError, match="Precio"):
        load_workbook(source)


@pytest.mark.parametrize(
    ("name", "code", "form"),
    [
        ("Cebada grano", "cebada", "grano"),
        ("Maíz forrajero en verde", "maiz_forrajero", "forraje_verde"),
        ("Sorgo forrajero en verde", "sorgo", "forraje_verde"),
        ("Alfalfa verde", "alfalfa", "forraje_verde"),
    ],
)
def test_categories(name, code, form):
    result = normalize(pd.DataFrame([record(Nomcultivo=name)]))
    assert result.loc[0, "crop_name"] == code
    assert result.loc[0, "crop_product_form"] == form
    assert result.loc[0, "Nomcultivo"] == name


def test_regions_cycle_modality():
    rows = [
        record(),
        record(
            Nommunicipio="El Marqués",
            Idmunicipio=11,
            Nomcicloproductivo="Perennes",
            Idciclo=3,
            Nommodalidad="Temporal",
            Idmodalidad=2,
        ),
    ]
    out, report = validate(normalize(pd.DataFrame(rows)))
    assert out["region_id"].tolist() == ["colon_queretaro", "el_marques_queretaro"]
    assert out["agricultural_cycle"].tolist() == ["Otoño-Invierno", "Perennes"]
    assert report["rejected"] == 0


def test_prices_zero_null_and_production_without_harvest():
    rows = [
        record(),
        record(Anio=2022, Preciomediorural=None, Precio=5),
        record(
            Anio=2023,
            Preciomediorural=None,
            Precio=0,
            Cosechada=0,
            Siniestrada=10,
            Volumenproduccion=0,
            Valorproduccion=0,
            Rendimiento=0,
        ),
        record(Anio=2024, Cosechada=0),
    ]
    out, _ = validate(normalize(pd.DataFrame(rows)))
    assert out["price_status"].tolist()[:3] == [
        "official_pmr",
        "workbook_price_unverified",
        "unavailable_no_production",
    ]
    assert out.loc[0, "price_from_value_volume"] == 5
    assert pd.isna(out.loc[2, "analytical_price"])
    assert out.loc[2, "Precio"] == 0 and out.loc[2, "damaged_area"] == 10
    assert "production_without_harvest" in out.loc[3, "quality_flags"]


def test_derived_price_and_inconsistent_price():
    rows = [record(Preciomediorural=None), record(Anio=2022, Preciomediorural=10)]
    out, _ = validate(normalize(pd.DataFrame(rows)))
    assert out.loc[0, "price_status"] == "derived_from_value_volume"
    assert out.loc[1, "price_status"] == "requires_review"
    assert out.loc[1, "pmr_price_difference_abs"] == 5


def test_weighted_aggregation_and_no_cycle_collapse_implicitly():
    rows = [
        record(),
        record(
            Idmodalidad=2,
            Nommodalidad="Temporal",
            Sembrada=30,
            Cosechada=30,
            Volumenproduccion=60,
            Valorproduccion=600,
            Preciomediorural=10,
        ),
    ]
    out, _ = validate(normalize(pd.DataFrame(rows)))
    assert len(aggregate(out, collapse_cycles=False)) == 2
    combined = aggregate(out, collapse_cycles=True)
    assert combined.loc[0, "price_from_value_volume"] == 8.75
    assert combined.loc[0, "dimensions_collapsed"] == "cycle;irrigation"


def test_duplicates_unknown_negative_nonfinite_and_null():
    rows = [
        record(),
        record(),
        record(Anio=2022, Nommunicipio="Otro", Sembrada=-1),
        record(Anio=2023, Volumenproduccion=np.inf),
        record(Anio=2024, Valorproduccion=None),
    ]
    out, report = validate(normalize(pd.DataFrame(rows)))
    assert report["rejected"] == 4 and report["warnings"] == 1
    assert "duplicate_key" in out.loc[0, "quality_flags"]
    assert "unknown_municipality" in out.loc[2, "quality_flags"]
    assert "invalid_numeric:Volumenproduccion" in out.loc[3, "quality_flags"]
    assert pd.isna(out.loc[4, "production_value"])
    assert pd.isna(aggregate(out, collapse_cycles=True).loc[0, "production_volume"])


def test_end_to_end_reproducible(tmp_path):
    source = tmp_path / "source.xlsx"
    workbook(source, [record(), record(Anio=2023)])
    before = source.read_bytes()
    output = tmp_path / "out"
    run(source, output)
    csvs = {p.name: p.read_bytes() for p in output.glob("*.csv")}
    report = json.loads((output / "data_quality_report.json").read_text(encoding="utf-8"))
    manifest = json.loads((output / "source_manifest.json").read_text(encoding="utf-8"))
    run(source, output)
    assert csvs == {p.name: p.read_bytes() for p in output.glob("*.csv")}
    assert report == json.loads((output / "data_quality_report.json").read_text(encoding="utf-8"))
    assert manifest["sha256"] == hashlib.sha256(before).hexdigest()
    assert report["years_missing_within_range"] == [2022]
    assert source.read_bytes() == before
    with pytest.raises(ValueError):
        run(source, tmp_path)


def test_unrecognized_values_and_id_mismatch():
    rows = [
        record(Nomcultivo="Desconocido", Nommodalidad="Otro", Nomcicloproductivo="Otro"),
        record(Anio=2022, Idcultivo=1),
    ]
    out, report = validate(normalize(pd.DataFrame(rows)))
    assert report["rejected"] == 2
    assert "unknown_crop" in out.loc[0, "quality_flags"]
    assert "unknown_cycle" in out.loc[0, "quality_flags"]
    assert "unknown_irrigation" in out.loc[0, "quality_flags"]
    assert "id_name_mismatch:Nomcultivo" in out.loc[1, "quality_flags"]


def test_zero_commercial_price_is_not_accepted_and_mixed_units_suppressed():
    rows = [
        record(Precio=0, Preciomediorural=None),
        record(Idmodalidad=2, Nommodalidad="Temporal", Nomunidad="Otra"),
    ]
    out, _ = validate(normalize(pd.DataFrame(rows)))
    assert out.loc[0, "price_status"] == "requires_review"
    assert pd.isna(out.loc[0, "analytical_price"])
    summary = aggregate(out, collapse_cycles=True)
    assert summary.loc[0, "aggregation_status"] == "requires_review"
    assert pd.isna(summary.loc[0, "price_from_value_volume"])


def test_missing_workbook_does_not_create_output(tmp_path):
    output = tmp_path / "result"
    with pytest.raises(FileNotFoundError):
        run(tmp_path / "missing.xlsx", output)
    assert not output.exists()
