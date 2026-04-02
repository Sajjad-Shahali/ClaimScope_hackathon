from __future__ import annotations

from pydantic import BaseModel, Field

from backend.app.schemas.common import ComparisonBlock


class KPIBlock(BaseModel):
    total_claims: int
    total_amount_paid: float
    avg_claim_paid: float | None = None
    median_claim_paid: float | None = None
    p95_claim_paid: float | None = None
    p99_claim_paid: float | None = None
    avg_claim_to_premium_ratio: float | None = Field(
        default=None,
        description="Claims-only imbalance proxy, not true profitability or loss ratio.",
    )
    median_claim_to_premium_ratio: float | None = None
    high_cost_claim_rate: float | None = None
    anomaly_count: int
    anomaly_rate: float | None = None


class KPIResponse(BaseModel):
    kpis: KPIBlock
    comparison: ComparisonBlock | None = None
