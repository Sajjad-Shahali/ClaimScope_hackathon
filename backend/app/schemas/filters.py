from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class FilterOptionsResponse(BaseModel):
    claim_date_min: date | None
    claim_date_max: date | None
    warranties: list[str]
    regions: list[str]
    provinces: list[str]
    brands: list[str]
    age_buckets: list[str]
    claim_years: list[int]
