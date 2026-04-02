from backend.app.repositories.analytics_repository import AnalyticsRepository


class AnomalyService:
    def __init__(self, repo: AnalyticsRepository) -> None:
        self.repo = repo

    def get_anomalies(self, filters: dict, page: int, page_size: int) -> dict:
        response = self.repo.get_anomalies(filters, page, page_size)
        for item in response["items"]:
            item["reasons"] = [reason.strip() for reason in str(item.pop("anomaly_reasons", "")).split(";") if reason.strip()]
        return response

    def get_summary(self, filters: dict) -> dict:
        return self.repo.get_anomaly_summary(filters)
