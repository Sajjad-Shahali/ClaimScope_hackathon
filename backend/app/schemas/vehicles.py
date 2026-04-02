from __future__ import annotations

from pydantic import BaseModel

from backend.app.schemas.common import RankingRow


class VehicleOverviewResponse(BaseModel):
    brands: list[RankingRow]
    models: list[RankingRow]


class BrandDetailResponse(BaseModel):
    brand: str
    summary: dict[str, float | int | None]
    top_models: list[dict[str, float | int | str | None]]
    warranty_mix: list[dict[str, float | int | str | None]]
    regional_mix: list[dict[str, float | int | str | None]]
    anomaly_rate: float | None = None


class ModelSearchResponse(BaseModel):
    items: list[str]
