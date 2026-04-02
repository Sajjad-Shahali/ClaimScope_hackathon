from backend.app.repositories.analytics_repository import AnalyticsRepository


class WarrantyService:
    def __init__(self, repo: AnalyticsRepository) -> None:
        self.repo = repo

    def get_overview(self, filters: dict) -> dict:
        return {"items": self.repo.get_warranty_overview(filters)}

    def get_trend(self, filters: dict) -> dict:
        return {"items": self.repo.get_warranty_trend(filters)}

    def get_detail(self, warranty_name: str, filters: dict) -> dict:
        return self.repo.get_warranty_detail(warranty_name, filters)
