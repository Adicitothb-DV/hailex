"""Load and validate the local, versioned crop catalog."""

from pathlib import Path

from app.schemas.crops import CropCatalog

CATALOG = Path(__file__).resolve().parents[1] / "data" / "crop_catalog.json"


def load_catalog(path: Path = CATALOG) -> CropCatalog:
    return CropCatalog.model_validate_json(path.read_text(encoding="utf-8"))
