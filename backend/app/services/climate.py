"""In-process bounded cache, historical fallback and immutable climate snapshots."""

import asyncio
import copy
import hashlib
import json
import time
from collections import OrderedDict
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from uuid import uuid4

from app.core.config import Settings
from app.schemas.climate import (
    ClimatePoint,
    ClimateSeries,
    Location,
    Period,
    Retrieval,
    Source,
    Variable,
)
from app.services.normalizer import NORMALIZER_VERSION, normalize
from app.services.power import COMMUNITY, PARAMETERS, TIME_STANDARD, PowerClient, PowerError

FIXTURES = Path(__file__).resolve().parents[1] / "data" / "fixtures" / "nasa_power"
SNAPSHOT_TTL = 1800


def source_record(version: str | None = None) -> Source:
    return Source(
        id="nasa-power-daily",
        organization="NASA POWER",
        product="Daily Point API",
        endpoint="https://power.larc.nasa.gov/api/temporal/daily/point",
        product_version=version,
        reference="https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
        status="implemented",
        limitations=[
            "Datos regionales modelados/estimados, no mediciones de parcela.",
            "Comunidad AG; estándar temporal UTC.",
        ],
    )


@dataclass
class Dataset:
    series: list[ClimatePoint]
    variables: list[Variable]
    warnings: list[str]
    retrieved_at: datetime
    version: str | None
    mode: str


class ClimateService:
    def __init__(self, settings: Settings, client: PowerClient | None = None):
        self.settings = settings
        self.client = client or PowerClient(
            settings.nasa_power_base_url, settings.nasa_power_timeout_seconds
        )
        self.cache: OrderedDict[tuple, tuple[float, Dataset]] = OrderedDict()
        self.snapshots: OrderedDict[str, tuple[float, ClimateSeries, list[str]]] = OrderedDict()
        self.lock = asyncio.Lock()

    def clear(self) -> None:
        self.cache.clear()
        self.snapshots.clear()

    def get_snapshot(self, snapshot_id: str) -> ClimateSeries:
        entry = self.snapshots.get(snapshot_id)
        if entry is None or entry[0] <= time.monotonic():
            self.snapshots.pop(snapshot_id, None)
            raise PowerError("CLIMATE_SNAPSHOT_EXPIRED", 409)
        return entry[1].model_copy(deep=True)

    def get_snapshot_warnings(self, snapshot_id: str) -> list[str]:
        self.get_snapshot(snapshot_id)
        return list(self.snapshots[snapshot_id][2])

    def _fixture(self, lat: float, lon: float, start: date, end: date) -> Dataset | None:
        for region in ("el_marques_queretaro", "colon_queretaro"):
            try:
                directory = FIXTURES / region
                manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
                coords = manifest["requested_coordinates"]
                if (lat, lon, start.isoformat(), end.isoformat()) != (
                    coords["latitude"],
                    coords["longitude"],
                    manifest["period_returned"]["start"],
                    manifest["period_returned"]["end"],
                ):
                    continue
                raw = (directory / "payload.json").read_bytes()
                if hashlib.sha256(raw).hexdigest() != manifest["payload_sha256"]:
                    continue
                payload = json.loads(raw)
                series, variables, warnings = normalize(payload, start, end)
                warnings.extend(manifest.get("warnings", []))
                warnings.append("Respaldo histórico archivado; no es una consulta en vivo.")
                retrieved = datetime.fromisoformat(
                    manifest["retrieved_at_utc"].replace("Z", "+00:00")
                )
                return Dataset(
                    series,
                    variables,
                    warnings,
                    retrieved,
                    payload["header"].get("api", {}).get("version"),
                    "historical_fixture",
                )
            except (OSError, ValueError, KeyError, TypeError, PowerError):
                continue
        return None

    async def query(
        self, lat: float, lon: float, start: date, end: date
    ) -> tuple[ClimateSeries, list[str]]:
        key = (lat, lon, start, end, PARAMETERS, COMMUNITY, TIME_STANDARD)
        # Lock covers upstream work to coalesce identical concurrent requests. Single worker only.
        async with self.lock:
            now = time.monotonic()
            for old_key in [k for k, entry in self.cache.items() if entry[0] <= now]:
                del self.cache[old_key]
            cached = self.cache.get(key)
            if cached:
                self.cache.move_to_end(key)
                dataset = copy.deepcopy(cached[1])
                mode = "cache"
            else:
                try:
                    payload = await self.client.fetch(lat, lon, start, end)
                    retrieved = datetime.now(UTC)
                    geometry = payload.get("geometry")
                    coords = geometry.get("coordinates", []) if isinstance(geometry, dict) else []
                    if (
                        not isinstance(coords, list)
                        or len(coords) < 2
                        or not all(
                            isinstance(v, (int, float)) and not isinstance(v, bool)
                            for v in coords[:2]
                        )
                        or abs(coords[0] - lon) > 0.001
                        or abs(coords[1] - lat) > 0.001
                    ):
                        raise PowerError("NASA_RESPONSE_ERROR", 502)
                    series, variables, warnings = normalize(payload, start, end)
                    version = payload["header"].get("api", {}).get("version")
                    dataset = Dataset(series, variables, warnings, retrieved, version, "upstream")
                    self.cache[key] = (
                        time.monotonic() + self.settings.climate_cache_ttl_seconds,
                        copy.deepcopy(dataset),
                    )
                    while len(self.cache) > self.settings.climate_cache_max_entries:
                        self.cache.popitem(last=False)
                    mode = "upstream"
                except PowerError as exc:
                    dataset = self._fixture(lat, lon, start, end)
                    if dataset is None:
                        raise
                    dataset.warnings.append(
                        f"Proveedor no disponible ({exc.code}); recuperación original conservada."
                    )
                    mode = "historical_fixture"
            current = datetime.now(UTC)
            for sid in [k for k, entry in self.snapshots.items() if entry[0] <= time.monotonic()]:
                del self.snapshots[sid]
            if len(self.snapshots) >= self.settings.climate_snapshot_max_entries:
                raise PowerError("SERVICE_UNAVAILABLE", 503)
            result = ClimateSeries(
                snapshot_id=str(uuid4()),
                snapshot_expires_at=current + timedelta(seconds=SNAPSHOT_TTL),
                location=Location(latitude=lat, longitude=lon),
                period=Period(start_date=start, end_date=end),
                community=COMMUNITY,
                time_standard=TIME_STANDARD,
                normalizer_version=NORMALIZER_VERSION,
                source=source_record(dataset.version),
                retrieval=Retrieval(
                    retrieval_mode=mode,
                    retrieved_at=dataset.retrieved_at,
                    served_at=current,
                    display_label=None,
                ),
                variables=dataset.variables,
                series=dataset.series,
            )
            self.snapshots[result.snapshot_id] = (
                time.monotonic() + SNAPSHOT_TTL,
                result.model_copy(deep=True),
                list(dataset.warnings),
            )
            return result, list(dataset.warnings)
