"""Illustrative, unvalidated adaptation of the supplied pest scoring rules."""

from shapely import MultiPoint, voronoi_polygons
from shapely.geometry import Point, mapping, shape
from shapely.validation import make_valid

from app.analysis.agroalert_geometry import LANDMARKS, municipality_feature

CROPS = {
    "El Marqués": [
        "maiz,alfalfa,brocoli",
        "alfalfa,brocoli,maiz",
        "maiz,alfalfa,cebada",
        "maiz,sorgo,cebada",
        "maiz,sorgo,cebada",
        "brocoli,maiz,alfalfa",
    ],
    "Colón": [
        "alfalfa,maiz,brocoli",
        "alfalfa,sorgo,brocoli",
        "brocoli,alfalfa,maiz",
        "sorgo,alfalfa,maiz",
        "maiz,sorgo,cebada",
    ],
}

PESTS = [
    (
        "gusano",
        "Gusano cogollero",
        "Spodoptera frugiperda",
        ["maiz", "sorgo"],
        ["temp", "rh", "rain7d"],
        "Revisar el cogollo y buscar daños y excretas.",
    ),
    (
        "pulgon_sorgo",
        "Pulgón amarillo del sorgo",
        "Melanaphis sacchari",
        ["sorgo", "maiz"],
        ["temp", "rh", "rain7d"],
        "Revisar el envés de las hojas en busca de colonias.",
    ),
    (
        "palomilla",
        "Palomilla dorso de diamante",
        "Plutella xylostella",
        ["brocoli"],
        ["temp", "rain7d"],
        "Inspeccionar hojas jóvenes y buscar larvas.",
    ),
    (
        "mosquita",
        "Mosquita blanca y trips",
        "Bemisia tabaci / Frankliniella spp.",
        ["brocoli", "alfalfa"],
        ["temp", "rh", "soil"],
        "Revisar brotes y trampas cromáticas.",
    ),
    (
        "pulgon_alfalfa",
        "Pulgón manchado de la alfalfa",
        "Therioaphis maculata",
        ["alfalfa"],
        ["temp", "rh"],
        "Inspeccionar tallos inferiores y rebrotes.",
    ),
    (
        "gallina",
        "Gallina ciega",
        "Phyllophaga spp.",
        ["maiz", "cebada", "sorgo"],
        ["soil", "rain7d"],
        "Muestrear suelo y raíces para buscar larvas.",
    ),
    (
        "hongos",
        "Mildiu y cenicilla foliar",
        "Peronospora / Erysiphe spp.",
        ["brocoli", "cebada", "alfalfa"],
        ["rh", "soil", "rain7d"],
        "Revisar hojas en busca de manchas y crecimiento blanquecino.",
    ),
]


def sectors(municipality: str) -> list[dict]:
    boundary = make_valid(shape(municipality_feature(municipality)["geometry"]))
    points = [Point(lon, lat) for _, lat, lon in LANDMARKS[municipality]]
    cells = list(voronoi_polygons(MultiPoint(points), extend_to=boundary.envelope).geoms)
    result = []
    for index, ((name, lat, lon), point) in enumerate(
        zip(LANDMARKS[municipality], points, strict=True)
    ):
        cell = next((c for c in cells if c.covers(point)), None)
        clipped = boundary.intersection(cell) if cell is not None else None
        result.append(
            {
                "id": str(index),
                "name": name,
                "lat": lat,
                "lon": lon,
                "crops": CROPS[municipality][index].split(","),
                "geometry": mapping(clipped)
                if clipped is not None and not clipped.is_empty
                else None,
            }
        )
    return result


def evaluate(weather: dict, crops: list[str], crop: str) -> dict:
    def norm(value: float) -> float:
        return max(0.0, min(1.0, value))

    evaluated = []
    for key, name, scientific, hosts, required, inspect in PESTS:
        if not (crop in hosts if crop != "ALL" else set(hosts) & set(crops)):
            continue
        missing = [field for field in required if weather.get(field) is None]
        score = None
        if not missing:
            t, rh, rain, soil = (weather.get(k) for k in ("temp", "rh", "rain7d", "soil"))
            if key == "gusano":
                score = (
                    22
                    + norm((t - 19) / 11) * 42
                    + norm((25 - rain) / 25) * 22
                    + norm(1 - abs(rh - 58) / 55) * 14
                )
            elif key == "pulgon_sorgo":
                score = (
                    18
                    + norm((t - 21) / 10) * 40
                    + norm((62 - rh) / 38) * 26
                    + norm((20 - rain) / 20) * 16
                )
            elif key == "palomilla":
                score = 25 + norm((t - 18) / 12) * 44 + norm((22 - rain) / 22) * 24
            elif key == "mosquita":
                score = (
                    20
                    + (norm((t - 20) / 11) * 0.55 + norm((60 - rh) / 35) * 0.45) * 54
                    + norm((50 - soil) / 40) * 20
                )
            elif key == "pulgon_alfalfa":
                score = 20 + norm((t - 20) / 10) * 45 + norm((58 - rh) / 34) * 28
            elif key == "gallina":
                score = 16 + norm((soil - 28) / 45) * 46 + norm(rain / 35) * 28
            else:
                score = (
                    14
                    + norm((rh - 52) / 38) * 44
                    + norm((soil - 40) / 45) * 22
                    + norm(rain / 45) * 16
                )
            score = round(max(0, min(100, score)))
        evaluated.append(
            {
                "id": key,
                "name": name,
                "scientific": scientific,
                "crops": hosts,
                "inspect": inspect,
                "score": score,
                "missing": missing,
                "status": "assessable" if score is not None else "not_assessable",
            }
        )
    evaluated.sort(key=lambda p: -(p["score"] if p["score"] is not None else -1))
    # Do not silently calculate a partial overall assessment.
    scores = [p["score"] for p in evaluated if p["score"] is not None]
    overall = (
        round(sum(scores[:3]) / min(len(scores), 3))
        if scores and len(scores) == len(evaluated)
        else None
    )
    return {"pests": evaluated, "overall": overall, "data_type": "simulation"}
