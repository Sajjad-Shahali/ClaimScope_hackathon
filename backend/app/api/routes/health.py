from fastapi import APIRouter, Depends

from backend.app.api.deps import get_db_manager
from backend.app.core.config import get_settings
from backend.app.db.duckdb import DuckDBManager
from backend.app.repositories.analytics_repository import AnalyticsRepository
from backend.app.schemas.health import HealthResponse

router = APIRouter(prefix="", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check(db: DuckDBManager = Depends(get_db_manager)) -> HealthResponse:
    settings = get_settings()
    repo = AnalyticsRepository(db)
    return HealthResponse(
        status="ok",
        app_name=settings.app_name,
        version=settings.app_version,
        duckdb_connected=db.is_connected(),
        data_last_loaded_at=repo.get_data_last_loaded_at(),
    )
