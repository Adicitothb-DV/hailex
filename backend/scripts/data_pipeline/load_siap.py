"""Read the original workbook without modifying it."""

import hashlib
from io import BytesIO
from pathlib import Path

import pandas as pd

SHEET = "Consolidado"
REQUIRED = (
    "Anio",
    "Idestado",
    "Nomestado",
    "Idddr",
    "Nomddr",
    "Idcader",
    "Nomcader",
    "Idmunicipio",
    "Nommunicipio",
    "Idciclo",
    "Nomcicloproductivo",
    "Idmodalidad",
    "Nommodalidad",
    "Idunidadmedida",
    "Nomunidad",
    "Idcultivo",
    "Nomcultivo",
    "Sembrada",
    "Cosechada",
    "Siniestrada",
    "Volumenproduccion",
    "Rendimiento",
    "Preciomediorural",
    "Valorproduccion",
    "Precio",
)


def load_workbook(path: Path) -> tuple[pd.DataFrame, str]:
    """Hash and parse the same bytes, preventing races between hashing and reading."""
    contents = path.read_bytes()
    digest = hashlib.sha256(contents).hexdigest()
    frame = pd.read_excel(BytesIO(contents), sheet_name=SHEET, engine="openpyxl")
    missing = sorted(set(REQUIRED) - set(frame.columns))
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")
    frame.insert(0, "source_row", range(2, len(frame) + 2))
    return frame, digest
