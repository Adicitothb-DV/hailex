"""Municipal grid for AgroAlert; local polygons are not verified official boundaries."""

import json
import math
from collections import Counter, defaultdict
from pathlib import Path

from shapely.geometry import box, mapping, shape
from shapely.validation import make_valid

DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "queretaro_municipios.geojson"
MUNICIPALITIES = {"El Marqués": "22011", "Colón": "22005"}
STEP = 0.09
LANDMARKS = {
    "El Marqués": [
        ("La Cañada", 20.608, -100.333),
        ("Amazcala", 20.706, -100.264),
        ("Chichimequillas", 20.771, -100.289),
        ("El Colorado", 20.565, -100.275),
        ("Atongo", 20.735, -100.215),
        ("La Griega", 20.659, -100.244),
    ],
    "Colón": [
        ("Colón (Cabecera)", 20.782, -100.055),
        ("Ajuchitlán", 20.715, -100.015),
        ("Galeras", 20.785, -100.185),
        ("Soriano", 20.768, -100.068),
        ("Esperanza", 20.845, -100.085),
    ],
}


def load_municipalities() -> dict:
    """Read the original collection without claiming its boundaries are official."""
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    if data.get("type") != "FeatureCollection" or len(data.get("features", [])) != 18:
        raise ValueError("Colección municipal inválida")
    return data


def municipality_feature(name: str) -> dict:
    if name not in MUNICIPALITIES:
        raise ValueError("Municipio no admitido")
    for feature in load_municipalities()["features"]:
        if str(feature["properties"].get("cvegeo")) == MUNICIPALITIES[name]:
            return feature
    raise ValueError("Municipio no encontrado")


def municipal_grid(name: str) -> list[dict]:
    """Build clipped 0.09-degree cells; coverage uses the source's planar areas."""
    polygon = shape(municipality_feature(name)["geometry"])
    if not polygon.is_valid:
        polygon = make_valid(polygon)
    if polygon.is_empty or polygon.geom_type not in ("Polygon", "MultiPolygon"):
        raise ValueError("Geometría municipal inválida")
    minx, miny, maxx, maxy = polygon.bounds
    lat_start = math.floor(miny / STEP)
    lon_start = math.floor(minx / STEP)
    cells = []
    for y in range(lat_start, math.ceil(maxy / STEP) + 2):
        for x in range(lon_start, math.ceil(maxx / STEP) + 2):
            lat, lon = round(y * STEP, 4), round(x * STEP, 4)
            square = box(lon - STEP / 2, lat - STEP / 2, lon + STEP / 2, lat + STEP / 2)
            clipped = polygon.intersection(square)
            coverage = 100 * clipped.area / square.area
            if clipped.is_empty or coverage < 5:
                continue
            point = clipped.representative_point()
            rx = (point.x - minx) / max(maxx - minx, 1e-6)
            ry = (point.y - miny) / max(maxy - miny, 1e-6)
            ns = "Sur" if ry < 0.36 else "Norte" if ry > 0.64 else ""
            ew = "Oeste" if rx < 0.36 else "Este" if rx > 0.64 else ""
            sector = "Sector " + ("-".join(filter(None, (ns, ew))) or "Centro")
            nearest = min(LANDMARKS[name], key=lambda p: math.hypot(point.y - p[1], point.x - p[2]))
            cells.append(
                {
                    "cell_id": f"{lat:.2f}N, {lon:.2f}W",
                    "municipality": name,
                    "latitude": lat,
                    "longitude": lon,
                    "label_latitude": point.y,
                    "label_longitude": point.x,
                    "coverage_percent": coverage,
                    "sector_name": sector,
                    "nearest_landmark": f"Cerca de {nearest[0]}",
                    "clipped_geometry": mapping(clipped),
                }
            )
    cells.sort(key=lambda cell: (-cell["latitude"], cell["longitude"]))
    totals = Counter(cell["sector_name"] for cell in cells)
    seen = defaultdict(int)
    for cell in cells:
        sector = cell["sector_name"]
        if totals[sector] > 1:
            seen[sector] += 1
            cell["sector_name"] = f"{sector} ({seen[sector]})"
    return cells
