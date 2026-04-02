from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

from backend.app.schemas.common import PaginationMeta


class ClaimListItem(BaseModel):
    claim_id: str
    claim_date: date | None
    warranty: str | None
    claim_region: str | None
    claim_province: str | None
    vehicle_brand: str | None
    vehicle_model: str | None
    claim_amount_paid: float | None
    premium_amount_paid: float | None
    claim_to_premium_ratio: float | None = Field(
        default=None,
        description="Claims-only imbalance proxy.",
    )
    high_cost_flag: bool
    anomaly_flag: bool
    anomaly_score: float | None = None
    anomaly_reason_summary: str | None = None


class ClaimsListResponse(BaseModel):
    items: list[ClaimListItem]
    pagination: PaginationMeta


class ClaimDetailResponse(BaseModel):
    claim_id: str
    raw_fields: dict[str, str | int | float | bool | None]
    engineered_fields: dict[str, str | int | float | bool | None]
    peer_group_benchmark: dict[str, str | int | float | bool | None]
    expected_claim: float | None = None
    residual: float | None = None
    anomaly_components: dict[str, float | int | str | bool | None]
    segment_context: dict[str, str | int | float | None]
    percentile_within_peer_group: float | None = None


class ClaimsQueryParams(BaseModel):
    page: int = 1
    page_size: int = 25
    sort_by: str = "claim_date"
    sort_order: Literal["asc", "desc"] = "desc"
