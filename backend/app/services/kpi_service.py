from __future__ import annotations

from datetime import date

from backend.app.repositories.analytics_repository import AnalyticsRepository
from backend.app.utils.dates import comparable_previous_period


class KPIService:
    def __init__(self, repo: AnalyticsRepository) -> None:
        self.repo = repo

    def get_kpis(self, filters: dict) -> dict:
        current = self.repo.get_kpis(filters)
        comparison = None
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")
        if isinstance(start_date, date) and isinstance(end_date, date):
            prev_start, prev_end = comparable_previous_period(start_date, end_date)
            prev_filters = dict(filters)
            prev_filters["start_date"] = prev_start
            prev_filters["end_date"] = prev_end
            previous = self.repo.get_kpis(prev_filters)
            delta = {
                key: (current.get(key) or 0) - (previous.get(key) or 0)
                if isinstance(current.get(key), (int, float)) or isinstance(previous.get(key), (int, float))
                else None
                for key in current
            }
            comparison = {
                "current_start_date": start_date,
                "current_end_date": end_date,
                "previous_start_date": prev_start,
                "previous_end_date": prev_end,
                "current": current,
                "previous": previous,
                "delta": delta,
            }
        return {"kpis": current, "comparison": comparison}
