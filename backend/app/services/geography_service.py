from backend.app.repositories.analytics_repository import AnalyticsRepository


class GeographyService:
    def __init__(self, repo: AnalyticsRepository) -> None:
        self.repo = repo

    def get_overview(self, filters: dict) -> dict:
        return self.repo.get_geography_overview(filters)

    def get_trend(self, filters: dict) -> dict:
        return {"items": self.repo.get_geography_trend(filters)}

    def get_region_detail(self, region_name: str, filters: dict) -> dict:
        return self.repo.get_region_detail(region_name, filters)

    def get_province_detail(self, province_name: str, filters: dict) -> dict:
        return self.repo.get_province_detail(province_name, filters)
