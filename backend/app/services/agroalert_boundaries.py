"""Validated OSM boundary synchronization, invoked by an operator, never public HTTP."""

import json
import os
import shutil
import tempfile
from datetime import UTC, datetime
from pathlib import Path

import httpx
from pyproj import Geod
from shapely.geometry import Point, mapping, shape
from shapely.ops import linemerge, polygonize, unary_union
from shapely.validation import make_valid

from app.analysis.agroalert_geometry import DATA_FILE

RELATIONS = {
    5605767: {
        "code": "22011",
        "wikidata": "Q2652454",
        "points": [
            (-100.333, 20.608),
            (-100.264, 20.706),
            (-100.289, 20.771),
            (-100.275, 20.565),
            (-100.215, 20.735),
        ],
    },
    5605684: {
        "code": "22005",
        "wikidata": "Q3849570",
        "points": [
            (-100.055, 20.782),
            (-100.015, 20.715),
            (-100.185, 20.785),
        ],
    },
}


def vertex_count(geom) -> int:
    if geom.geom_type == "Polygon":
        return len(geom.exterior.coords) + sum(len(ring.coords) for ring in geom.interiors)
    if geom.geom_type == "MultiPolygon":
        return sum(vertex_count(part) for part in geom.geoms)
    return 0


def normalize(geom):
    if not geom.is_valid:
        geom = make_valid(geom)
    if geom.geom_type == "GeometryCollection":
        geom = unary_union(
            [part for part in geom.geoms if part.geom_type in {"Polygon", "MultiPolygon"}]
        )
    if geom.is_empty or geom.geom_type not in {"Polygon", "MultiPolygon"} or not geom.is_valid:
        raise ValueError("Geometría no poligonal o inválida")
    return geom


def parse_nominatim(payload: dict) -> dict:
    result = {}
    for feature in payload.get("features", []):
        props = feature.get("properties", {})
        relation = props.get("osm_id")
        if props.get("osm_type") == "relation" and relation in RELATIONS:
            result[RELATIONS[relation]["code"]] = normalize(shape(feature["geometry"]))
    return result


def parse_overpass(payload: dict) -> dict:
    result = {}
    for element in payload.get("elements", []):
        relation = element.get("id")
        if element.get("type") != "relation" or relation not in RELATIONS:
            continue
        lines = {"outer": [], "inner": []}
        for member in element.get("members", []):
            role = member.get("role") or "outer"
            if member.get("type") == "way" and role in lines:
                coords = [(node["lon"], node["lat"]) for node in member.get("geometry", [])]
                if len(coords) >= 2:
                    lines[role].append(coords)

        def polygons(segments):
            return list(polygonize(linemerge(segments))) if segments else []

        outer = unary_union(polygons(lines["outer"]))
        inner = unary_union(polygons(lines["inner"]))
        result[RELATIONS[relation]["code"]] = normalize(outer.difference(inner))
    return result


def validate(geometries: dict) -> None:
    if set(geometries) != {"22011", "22005"}:
        raise ValueError("Faltan límites municipales")
    if geometries["22011"].intersection(geometries["22005"]).area > 1e-6:
        raise ValueError("Traslape municipal excesivo")
    for meta in RELATIONS.values():
        geom = geometries[meta["code"]]
        if not geom.is_valid or vertex_count(geom) < 500:
            raise ValueError("Geometría inválida o insuficiente")
        if not all(geom.contains(Point(lon, lat)) for lon, lat in meta["points"]):
            raise ValueError("Fallo en puntos de control")


def update(geometries: dict, path: Path = DATA_FILE) -> None:
    validate(geometries)
    original = path.read_bytes()
    data = json.loads(original)
    if data.get("type") != "FeatureCollection" or len(data.get("features", [])) != 18:
        raise ValueError("Colección local inválida")
    codes = set()
    for feature in data["features"]:
        props = feature["properties"]
        code = str(props.get("cvegeo"))
        if code not in geometries:
            continue
        codes.add(code)
        relation, meta = next((rid, m) for rid, m in RELATIONS.items() if m["code"] == code)
        geom = geometries[code]
        minx, miny, maxx, maxy = geom.bounds
        point = geom.representative_point()
        area, _ = Geod(ellps="WGS84").geometry_area_perimeter(geom)
        props.update(
            {
                "lat": point.y,
                "lon": point.x,
                "lat_min": miny,
                "lat_max": maxy,
                "lon_min": minx,
                "lon_max": maxx,
                "area_km2": round(abs(area) / 1e6, 2),
                "osm_relation_id": relation,
                "wikidata": meta["wikidata"],
                "fuente_limites": f"OpenStreetMap relation R{relation}",
                "vertices_reales": vertex_count(geom),
                "actualizado_utc": datetime.now(UTC).isoformat(),
            }
        )
        feature["geometry"] = mapping(geom)
    if codes != set(geometries):
        raise ValueError("Municipio ausente en colección local")
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=path.parent, delete=False
        ) as file:
            temporary = Path(file.name)
            json.dump(data, file, ensure_ascii=False)
            file.flush()
            os.fsync(file.fileno())
        parsed = json.loads(temporary.read_text(encoding="utf-8"))
        validate(
            {
                str(f["properties"]["cvegeo"]): shape(f["geometry"])
                for f in parsed["features"]
                if str(f["properties"].get("cvegeo")) in geometries
            }
        )
        backup = path.with_name(path.stem + ".backup.geojson")
        if not backup.exists():
            shutil.copyfile(path, backup)
        os.replace(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def sync(force: bool = False, path: Path = DATA_FILE) -> bool:
    if not force:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            geometries = {
                str(f["properties"]["cvegeo"]): shape(f["geometry"])
                for f in data["features"]
                if str(f["properties"].get("cvegeo")) in {"22011", "22005"}
            }
            validate(geometries)
            return False
        except (ValueError, KeyError, OSError):
            pass
    with httpx.Client(
        timeout=60, headers={"User-Agent": "HaiLex/1.0 (municipal boundary update)"}
    ) as client:
        for source in ("nominatim", "overpass"):
            try:
                if source == "nominatim":
                    response = client.get(
                        "https://nominatim.openstreetmap.org/lookup",
                        params={
                            "osm_ids": "R5605767,R5605684",
                            "format": "geojson",
                            "polygon_geojson": 1,
                            "polygon_threshold": 0.0,
                        },
                    )
                    response.raise_for_status()
                    geometries = parse_nominatim(response.json())
                else:
                    response = client.post(
                        "https://overpass-api.de/api/interpreter",
                        data={
                            "data": "[out:json][timeout:60];(relation(5605767);relation(5605684););out geom;"
                        },
                    )
                    response.raise_for_status()
                    geometries = parse_overpass(response.json())
                validate(geometries)
                update(geometries, path)
                return True
            except (httpx.HTTPError, ValueError, KeyError, TypeError):
                continue
    raise ValueError("No se pudo sincronizar; se conservan los límites locales")
