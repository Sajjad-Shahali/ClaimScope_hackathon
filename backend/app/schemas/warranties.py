from __future__ import annotations

from pydantic import BaseModel

from backend.app.schemas.common import RankingRow, TrendPoint


class WarrantyOverviewResponse(BaseModel):
    items: list[RankingRow]


class WarrantyDetailBreakdownRow(BaseModel):
    segment: str
    metric_value: float
    claim_count: int | None = None


class WarrantyDetailResponse(BaseModel):
    warranty: str
    volume: int
    severity_avg: float | None = None
    imbalance_proxy_avg: float | None = None
    anomaly_rate: float | None = None
    top_regions: list[WarrantyDetailBreakdownRow]
    top_brands: list[WarrantyDetailBreakdownRow]
    time_trend_summary: list[TrendPoint]


class WarrantyTrendResponse(BaseModel):
    items: list[TrendPoint]
