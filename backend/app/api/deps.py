from collections.abc import Generator

from backend.app.db.duckdb import DuckDBManager
from backend.app.repositories.analytics_repository import AnalyticsRepository
from backend.app.services.anomaly_service import AnomalyService
from backend.app.services.claim_service import ClaimService
from backend.app.services.filter_service import FilterService
from backend.app.services.geography_service import GeographyService
from backend.app.services.insight_service import InsightService
from backend.app.services.kpi_service import KPIService
from backend.app.services.vehicle_service import VehicleService
from backend.app.services.warranty_service import WarrantyService


def get_db_manager() -> Generator[DuckDBManager, None, None]:
    db = DuckDBManager()
    try:
        yield db
    finally:
        db.close()


def get_repository(db: DuckDBManager) -> AnalyticsRepository:
    return AnalyticsRepository(db)


def get_filter_service(db: DuckDBManager) -> FilterService:
    return FilterService(get_repository(db))


def get_kpi_service(db: DuckDBManager) -> KPIService:
    return KPIService(get_repository(db))


def get_warranty_service(db: DuckDBManager) -> WarrantyService:
    return WarrantyService(get_repository(db))


def get_geography_service(db: DuckDBManager) -> GeographyService:
    return GeographyService(get_repository(db))


def get_vehicle_service(db: DuckDBManager) -> VehicleService:
    return VehicleService(get_repository(db))


def get_claim_service(db: DuckDBManager) -> ClaimService:
    return ClaimService(get_repository(db))


def get_anomaly_service(db: DuckDBManager) -> AnomalyService:
    return AnomalyService(get_repository(db))


def get_insight_service(db: DuckDBManager) -> InsightService:
    return InsightService(get_repository(db))
