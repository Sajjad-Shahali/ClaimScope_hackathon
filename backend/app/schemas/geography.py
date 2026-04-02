from __future__ import annotations

from pydantic import BaseModel

from backend.app.schemas.common import RankingRow, TrendPoint


class GeographyOverviewResponse(BaseModel):
    regions: list[RankingRow]
    provinces: list[RankingRow]


class GeographyDetailResponse(BaseModel):
    geography_type: str
    geography_name: str
    summary: dict[str, float | int | None]
    breakdown: list[dict[str, float | int | str | None]]


class GeographyTrendResponse(BaseModel):
    items: list[TrendPoint]
