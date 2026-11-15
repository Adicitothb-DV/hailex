"""Small, bounded Sentinel-2 AOI processor; no user-supplied raster URLs."""

import hashlib
import json
import math
import re
from datetime import UTC, date, datetime
from pathlib import Path
from urllib.parse import urlparse

import httpx
import numpy as np
import rasterio
from PIL import Image
from pyproj import Geod
from rasterio.enums import Resampling
from rasterio.features import geometry_mask
from rasterio.transform import from_bounds
from rasterio.vrt import WarpedVRT
from shapely.geometry import shape

ROOT = Path(__file__).resolve().parents[2] / "data" / "processed" / "field_analyses"
COLLECTION = "sentinel-2-l2a"
ASSETS = ("red", "green", "blue", "nir", "swir16", "scl")
HOST = "sentinel-cogs.s3.us-west-2.amazonaws.com"
VERSION = "1.0.0"
GEOD = Geod(ellps="WGS84")


class FieldError(ValueError):
    pass


def validate_geometry(geometry: dict) -> tuple[float, float, tuple]:
    if geometry.get("type") not in ("Polygon", "MultiPolygon"):
        raise FieldError("La geometría debe ser Polygon o MultiPolygon GeoJSON.")
    polygons = geometry.get("coordinates")
    if not isinstance(polygons, list) or not polygons:
        raise FieldError("Geometría vacía.")
    if geometry["type"] == "Polygon":
        polygons = [polygons]
    count = 0
    try:
        for polygon in polygons:
            if not polygon:
                raise FieldError("Polígono vacío.")
            for ring in polygon:
                if len(ring) < 4 or ring[0] != ring[-1]:
                    raise FieldError(
                        "Los anillos deben estar cerrados y tener al menos cuatro posiciones."
                    )
                for point in ring:
                    if len(point) != 2 or any(
                        isinstance(x, bool)
                        or not isinstance(x, (int, float))
                        or not math.isfinite(x)
                        for x in point
                    ):
                        raise FieldError("Coordenadas inválidas.")
                    if not -180 <= point[0] <= 180 or not -90 <= point[1] <= 90:
                        raise FieldError("Coordenadas fuera de rango.")
                    count += 1
        if count > 500:
            raise FieldError("Máximo 500 vértices.")
        geom = shape(geometry)
        if geom.is_empty or not geom.is_valid:
            raise FieldError("Geometría inválida o autointersectada.")
        xmin, ymin, xmax, ymax = geom.bounds
        if xmax - xmin > 0.1 or ymax - ymin > 0.1 or max(abs(ymin), abs(ymax)) > 85:
            raise FieldError("Extensión demasiado grande o fuera del rango operativo.")
        # Ring winding must not cause valid areas to cancel between parts or holes.
        from shapely.geometry import MultiPolygon
        from shapely.geometry.polygon import orient

        geom = (
            orient(geom, sign=1.0)
            if geom.geom_type == "Polygon"
            else MultiPolygon([orient(p, sign=1.0) for p in geom.geoms])
        )
        area, perimeter = GEOD.geometry_area_perimeter(geom)
        hectares = abs(area) / 10000
        if hectares <= 0 or hectares > 500:
            raise FieldError("Área inválida o superior al límite de 500 ha.")
        return hectares, perimeter, geom.bounds
    except (TypeError, IndexError, KeyError) as exc:
        raise FieldError("GeoJSON inválido.") from exc


def check_asset(asset: dict) -> str:
    url = asset.get("href", "")
    parsed = urlparse(url)
    if (
        parsed.scheme != "https"
        or parsed.hostname != HOST
        or parsed.port not in (None, 443)
        or parsed.username
        or parsed.password
    ):
        raise FieldError("Asset satelital de origen no permitido.")
    if not parsed.path.lower().endswith(".tif") or not asset.get("type", "").startswith(
        "image/tiff"
    ):
        raise FieldError("El asset no es un GeoTIFF válido.")
    return url


def search_scenes(geometry: dict, start: date, end: date, max_cloud: float) -> list[dict]:
    validate_geometry(geometry)
    if start > end or (end - start).days > 366 or end > datetime.now(UTC).date():
        raise FieldError("Periodo inválido; máximo 366 días y sin fechas futuras.")
    if not 0 <= max_cloud <= 100:
        raise FieldError("Nubosidad inválida.")
    query = {
        "collections": [COLLECTION],
        "intersects": geometry,
        "datetime": f"{start.isoformat()}T00:00:00Z/{end.isoformat()}T23:59:59Z",
        "limit": 20,
    }
    with httpx.Client(timeout=25, follow_redirects=False) as client:
        with client.stream(
            "POST", "https://earth-search.aws.element84.com/v1/search", json=query
        ) as response:
            response.raise_for_status()
            parts = bytearray()
            for chunk in response.iter_bytes():
                parts.extend(chunk)
                if len(parts) > 8 * 1024 * 1024:
                    raise FieldError("La respuesta del catálogo excede el límite de tamaño.")
            payload = json.loads(parts)
    scenes = []
    for item in payload.get("features", []):
        props, assets = item.get("properties", {}), item.get("assets", {})
        cloud = props.get("eo:cloud_cover")
        if not isinstance(cloud, (int, float)) or not math.isfinite(cloud) or cloud > max_cloud:
            continue
        if props.get("earthsearch:boa_offset_applied") is not True:
            # The provider documents inconsistent offset metadata; fail closed.
            continue
        if not all(key in assets for key in ASSETS):
            continue
        try:
            for key in ASSETS:
                check_asset(assets[key])
        except FieldError:
            continue
        scenes.append(item)
    return sorted(scenes, key=lambda x: x["properties"].get("datetime", ""), reverse=True)


def ratio(nir: np.ndarray, other: np.ndarray, valid: np.ndarray) -> np.ndarray:
    denominator = nir + other
    output = np.full(nir.shape, np.nan, dtype="float32")
    np.divide(
        nir - other,
        denominator,
        out=output,
        where=valid & np.isfinite(denominator) & (np.abs(denominator) > 1e-8),
    )
    output[(output < -1) | (output > 1)] = np.nan
    return output


def statistics(values: np.ndarray) -> dict | None:
    v = values[np.isfinite(values)]
    if not v.size:
        return None
    return {
        "count": int(v.size),
        "mean": float(np.mean(v)),
        "median": float(np.median(v)),
        "p10": float(np.percentile(v, 10)),
        "p90": float(np.percentile(v, 90)),
        "min": float(np.min(v)),
        "max": float(np.max(v)),
    }


def grid(bounds: tuple, resolution: int) -> tuple:
    left, bottom, right, top = bounds
    lon_m = abs(GEOD.inv(left, (bottom + top) / 2, right, (bottom + top) / 2)[2])
    lat_m = abs(GEOD.inv(left, bottom, left, top)[2])
    width, height = max(1, math.ceil(lon_m / resolution)), max(1, math.ceil(lat_m / resolution))
    if width > 1024 or height > 1024 or width * height > 400000:
        raise FieldError("El raster solicitado excede los límites de procesamiento.")
    return width, height, from_bounds(left, bottom, right, top, width, height)


def process_grid(item: dict, geometry: dict, bounds: tuple, resolution: int, names: tuple) -> tuple:
    width, height, transform = grid(bounds, resolution)
    inside = geometry_mask([geometry], out_shape=(height, width), transform=transform, invert=True)
    arrays, masks = {}, []
    with rasterio.Env(
        GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",
        CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif",
        GDAL_HTTP_TIMEOUT="15",
        GDAL_HTTP_MAX_RETRY="1",
        GDAL_HTTP_FOLLOW_REDIRECTS="NO",
    ):
        for name in (*names, "scl"):
            asset = item["assets"][name]
            url = check_asset(asset)
            with rasterio.open(url) as src:
                with WarpedVRT(
                    src,
                    crs="EPSG:4326",
                    transform=transform,
                    width=width,
                    height=height,
                    resampling=Resampling.nearest,
                ) as vrt:
                    arr = vrt.read(1, masked=True)
            masks.append(~np.ma.getmaskarray(arr))
            if name == "scl":
                arrays[name] = arr.filled(0)
            else:
                metadata = asset.get("raster:bands", [{}])[0]
                scale = float(metadata.get("scale", 0.0001))
                # Earth Search notes that some COGs already have the BOA offset applied.
                # The catalog metadata has known inconsistencies: disclose this uncertainty.
                offset = (
                    0.0
                    if item["properties"].get("earthsearch:boa_offset_applied") is True
                    else float(metadata.get("offset", 0))
                )
                arrays[name] = arr.filled(0).astype("float32") * scale + offset
    valid = inside & np.logical_and.reduce(masks) & np.isin(arrays["scl"], [4, 5, 6])
    return arrays, valid, inside


def save_index(path: Path, values: np.ndarray) -> None:
    valid = np.isfinite(values)
    x = np.clip((np.nan_to_num(values, nan=-1) + 1) / 2, 0, 1)
    image = np.stack([255 * (1 - x), 200 * x, 50 + 45 * x, valid * 210], axis=-1).astype("uint8")
    Image.fromarray(image, "RGBA").save(path)


def analyze(
    geometry: dict,
    start: date,
    end: date,
    cloud: float,
    name: str,
    municipality: str,
    crop: str,
    item_id: str | None = None,
) -> dict:
    area, perimeter, bounds = validate_geometry(geometry)
    scenes = search_scenes(geometry, start, end, cloud)
    if item_id:
        scenes = [scene for scene in scenes if scene.get("id") == item_id]
    if not scenes:
        return {
            "status": "no_clear_scene",
            "message": "No hay escenas con los filtros indicados.",
            "area_ha": area,
            "scenes": [],
        }
    item = scenes[0]
    key = json.dumps(
        {
            "geometry": geometry,
            "item": item["id"],
            "version": VERSION,
            "name": name,
            "municipality": municipality,
            "crop": crop,
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    analysis_id = hashlib.sha256(key.encode()).hexdigest()[:32]
    directory = ROOT / analysis_id
    manifest = directory / "manifest.json"
    if manifest.is_file():
        return json.loads(manifest.read_text(encoding="utf-8"))
    a10, valid10, inside10 = process_grid(
        item, geometry, bounds, 10, ("red", "green", "blue", "nir")
    )
    a20, valid20, inside20 = process_grid(item, geometry, bounds, 20, ("nir", "swir16"))
    ndvi = ratio(a10["nir"], a10["red"], valid10)
    ndmi = ratio(a20["nir"], a20["swir16"], valid20)
    total10, total20 = int(inside10.sum()), int(inside20.sum())
    coverage10 = float(np.isfinite(ndvi).sum() / total10 * 100) if total10 else 0.0
    coverage20 = float(np.isfinite(ndmi).sum() / total20 * 100) if total20 else 0.0
    directory.mkdir(parents=True, exist_ok=True)
    rgb = np.stack(
        [np.clip(a10[k] / 0.3 * 255, 0, 255) for k in ("red", "green", "blue")] + [valid10 * 255],
        axis=-1,
    ).astype("uint8")
    Image.fromarray(rgb, "RGBA").save(directory / "true-color.png")
    save_index(directory / "ndvi.png", ndvi)
    save_index(directory / "ndmi.png", ndmi)
    result = {
        "analysis_id": analysis_id,
        "status": "success" if min(coverage10, coverage20) >= 70 else "insufficient_data",
        "created_at": datetime.now(UTC).isoformat(),
        "aoi": {
            "geometry": geometry,
            "area_ha": area,
            "perimeter_m": perimeter,
            "name": name,
            "municipality_label": municipality,
            "crop": crop,
        },
        "satellite_source": "Copernicus Sentinel-2 L2A / Element 84 Earth Search",
        "collection": COLLECTION,
        "item_id": item["id"],
        "acquired_at": item["properties"].get("datetime"),
        "cloud_cover_scene_percent": item["properties"].get("eo:cloud_cover"),
        "valid_pixel_percent_in_aoi": coverage10,
        "ndmi_valid_pixel_percent_in_aoi": coverage20,
        "masked_pixel_percent_in_aoi": 100 - coverage10,
        "indices": {"ndvi": statistics(ndvi), "ndmi": statistics(ndmi)},
        "native_resolution_by_index": {
            "ndvi": "B08 y B04: 10 m",
            "ndmi": "B08: 10 m, B11: 20 m; salida aproximada 20 m",
        },
        "bbox": list(bounds),
        "layers": {
            k: f"/api/v1/fields/analyses/{analysis_id}/layers/{k}"
            for k in ("true-color", "ndvi", "ndmi")
        },
        "quality_flags": [
            "scl_only_4_5_6",
            "geographic_grid_approximate_resolution",
            "boa_metadata_uncertainty",
        ],
        "warnings": [
            "SCL: solo clases 4, 5 y 6; las demás se excluyen.",
            "La nubosidad de escena no equivale a cobertura válida en la parcela.",
            "Earth Search informa inconsistencias conocidas en los metadatos de offset; interpretar reflectancia e índices con cautela.",
        ],
        "limitations": [
            "NDVI indica verdor relativo, no diagnóstico ni rendimiento.",
            "NDMI es un proxy de agua en vegetación, no humedad de suelo.",
            "Polígono proporcionado por usuario: no es un linde legal.",
            "La cuadrícula geográfica tiene resolución aproximada; no equivale a una medición de campo.",
        ],
    }
    manifest.write_text(
        json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8"
    )
    return result


def analysis_path(analysis_id: str) -> Path:
    if not re.fullmatch(r"[a-f0-9]{32}", analysis_id):
        raise FieldError("Identificador inválido.")
    return ROOT / analysis_id
