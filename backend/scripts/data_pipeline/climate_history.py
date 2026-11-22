"""Acquire historical POWER data with verified fixture reuse and resumable snapshots."""

import asyncio
import hashlib
import json
from datetime import UTC, date, datetime
from pathlib import Path

from app.services.normalizer import NORMALIZER_VERSION, normalize
from app.services.power import PowerClient, PowerError

BACKEND = Path(__file__).resolve().parents[2]
FIXTURES = BACKEND / "app/data/fixtures/nasa_power"
RAW = BACKEND / "data/raw/nasa_power/annual_history"
ENDPOINT = "https://power.larc.nasa.gov/api/temporal/daily/point"
REGIONS = {
    "colon_queretaro": (20.78832639, -100.04543056),
    "el_marques_queretaro": (20.60656972, -100.33109667),
}
START, END = date(2003, 1, 1), date(2024, 12, 31)


def checked_payload(raw: bytes, start: date, end: date, coords: tuple[float, float]):
    payload = json.loads(raw)
    points, variables, warnings = normalize(payload, start, end)
    lon, lat = payload["geometry"]["coordinates"][:2]
    if abs(lat - coords[0]) > 0.001 or abs(lon - coords[1]) > 0.001:
        raise ValueError("POWER coordinates do not match requested location")
    return payload, points, variables, warnings


def fixture(region: str):
    folder = FIXTURES / region
    manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
    raw = (folder / "payload.json").read_bytes()
    if hashlib.sha256(raw).hexdigest() != manifest["payload_sha256"]:
        raise ValueError(f"Fixture hash mismatch: {region}")
    expected = manifest["requested_coordinates"]
    if (expected["latitude"], expected["longitude"]) != REGIONS[region]:
        raise ValueError(f"Fixture coordinates mismatch: {region}")
    return raw, manifest


def cached(region: str):
    folder = RAW / region
    path, manifest_path = folder / "2003_2024.json", folder / "2003_2024.manifest.json"
    if not path.exists() and not manifest_path.exists():
        return None
    if not path.exists() or not manifest_path.exists():
        raise ValueError(f"Incomplete cached snapshot: {region}")
    raw = path.read_bytes()
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if hashlib.sha256(raw).hexdigest() != manifest["sha256"]:
        raise ValueError(f"Cached snapshot hash mismatch: {region}")
    if manifest["coordinates"] != list(REGIONS[region]):
        raise ValueError(f"Cached coordinates mismatch: {region}")
    checked_payload(raw, START, END, REGIONS[region])
    return raw, manifest


async def acquire(region: str):
    previous = cached(region)
    if previous:
        return previous
    latitude, longitude = REGIONS[region]
    payload = await PowerClient(ENDPOINT, timeout=120).fetch(latitude, longitude, START, END)
    # PowerClient returns parsed JSON; this is a canonical snapshot, not raw HTTP bytes.
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode(
        "utf-8"
    )
    _, _, variables, warnings = checked_payload(raw, START, END, REGIONS[region])
    manifest = {
        "region": region,
        "coordinates": [latitude, longitude],
        "start": START.isoformat(),
        "end": END.isoformat(),
        "retrieved_at_utc": datetime.now(UTC).isoformat(),
        "endpoint": ENDPOINT,
        "community": "AG",
        "time_standard": "UTC",
        "parameters": [v.id for v in variables],
        "sha256": hashlib.sha256(raw).hexdigest(),
        "storage": "canonical JSON reserialized from PowerClient parsed response, not HTTP bytes",
        "normalizer_version": NORMALIZER_VERSION,
        "warnings": warnings,
    }
    folder = RAW / region
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "2003_2024.json").write_bytes(raw)
    (folder / "2003_2024.manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return raw, manifest


async def acquire_all():
    failures = {}
    for region in REGIONS:
        try:
            await acquire(region)
            print(f"{region}: historical snapshot ready")
        except (PowerError, OSError, ValueError) as exc:
            failures[region] = str(exc)
            print(f"{region}: unavailable ({type(exc).__name__}: {exc})")
            # Stop after a provider failure to avoid repeated requests.
            break
    return failures


if __name__ == "__main__":
    result = asyncio.run(acquire_all())
    if result:
        raise SystemExit(1)
