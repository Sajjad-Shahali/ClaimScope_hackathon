from __future__ import annotations

from pydantic import BaseModel


class InsightSummaryResponse(BaseModel):
    top_findings: list[str]
    top_warranty_risks: list[str]
    top_geography_risks: list[str]
    top_vehicle_segment_risks: list[str]
    anomaly_headlines: list[str]
    caveats: list[str]
