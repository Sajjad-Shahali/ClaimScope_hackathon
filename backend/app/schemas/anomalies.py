from __future__ import annotations

from pydantic import BaseModel

from backend.app.schemas.common import PaginationMeta


class AnomalyListItem(BaseModel):
    claim_id: str
    claim_date: str | None
    warranty: str | None
    claim_region: str | None
    vehicle_brand: str | None
    claim_amount_paid: float | None
    anomaly_score: float
    anomaly_flag: bool
    reasons: list[str]


class AnomalyListResponse(BaseModel):
    items: list[AnomalyListItem]
    pagination: PaginationMeta


class AnomalySummaryResponse(BaseModel):
    anomaly_count: int
    anomaly_rate: float | None = None
    concentration_by_warranty: list[dict[str, float | int | str | None]]
    concentration_by_region: list[dict[str, float | int | str | None]]
    concentration_by_brand: list[dict[str, float | int | str | None]]
    top_reason_buckets: list[dict[str, float | int | str | None]]
