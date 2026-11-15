"""Public climate wire models, matching the canonical V1 contract."""

from datetime import date, datetime
from typing import Literal

from app.schemas.common import WireModel


class Location(WireModel):
    latitude: float
    longitude: float


class Period(WireModel):
    start_date: date
    end_date: date


class Source(WireModel):
    id: str
    organization: str
    product: str
    endpoint: str | None
    product_version: str | None
    reference: str | None
    status: Literal["implemented", "partial", "planned", "unavailable"]
    limitations: list[str]


class SourceEntry(Source):
    parameters: list[str]


class SourcesData(WireModel):
    sources: list[SourceEntry]


class Retrieval(WireModel):
    retrieval_mode: Literal["upstream", "cache", "historical_fixture", "demo_fixture"]
    retrieved_at: datetime | None
    served_at: datetime
    display_label: str | None


class Variable(WireModel):
    id: str
    source_id: str
    unit: str | None
    data_type: Literal["observation", "estimate", "model", "derived", "simulation", "unknown"]
    spatial_resolution: str | None
    temporal_resolution: Literal["daily"]
    valid_count: int
    missing_count: int
    limitations: list[str]


class ClimatePoint(WireModel):
    date: date
    T2M: float | None
    PRECTOTCORR: float | None
    ALLSKY_SFC_SW_DWN: float | None


class ClimateSeries(WireModel):
    snapshot_id: str
    snapshot_expires_at: datetime
    location: Location
    period: Period
    community: Literal["AG"]
    time_standard: Literal["UTC"]
    normalizer_version: str
    source: Source
    retrieval: Retrieval
    variables: list[Variable]
    series: list[ClimatePoint]
