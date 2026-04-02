from backend.app.repositories.analytics_repository import AnalyticsRepository


class VehicleService:
    def __init__(self, repo: AnalyticsRepository) -> None:
        self.repo = repo

    def get_overview(self, filters: dict) -> dict:
        return self.repo.get_vehicle_overview(filters)

    def get_brand_detail(self, brand_name: str, filters: dict) -> dict:
        return self.repo.get_brand_detail(brand_name, filters)

    def search_models(self, q: str) -> dict:
        return {"items": self.repo.search_models(q)}
