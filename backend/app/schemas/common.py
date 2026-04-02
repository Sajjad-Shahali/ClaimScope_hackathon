from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


class ApiMessage(BaseModel):
    message: str


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_records: int
    total_pages: int


class PaginatedResponse(BaseModel):
    items: list[Any]
    pagination: PaginationMeta


class TrendPoint(BaseModel):
    period: str
    value: float
    group: str | None = None


class RankingRow(BaseModel):
    segment: str
    claim_count: int
    total_claim_paid: float
    avg_claim_paid: float
    median_claim_paid: float | None = None
    avg_claim_to_premium_ratio: float | None = Field(
        default=None,
        description="Imbalance proxy derived from claims-only premium field.",
    )
    p95_claim_paid: float | None = None
    high_cost_share: float | None = None
    volatility: float | None = None
    concentration_share: float | None = None


class ComparisonBlock(BaseModel):
    current_start_date: date | None = None
    current_end_date: date | None = None
    previous_start_date: date | None = None
    previous_end_date: date | None = None
    current: dict[str, float | int | None]
    previous: dict[str, float | int | None]
    delta: dict[str, float | int | None]


class DataTimestamp(BaseModel):
    data_last_loaded_at: datetime | None = None
