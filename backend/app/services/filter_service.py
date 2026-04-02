from backend.app.repositories.analytics_repository import AnalyticsRepository


class FilterService:
    def __init__(self, repo: AnalyticsRepository) -> None:
        self.repo = repo

    def get_filters(self) -> dict:
        return self.repo.get_filters()
