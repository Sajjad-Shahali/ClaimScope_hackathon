from datetime import date

from fastapi import APIRouter, Depends

from backend.app.api.deps import get_db_manager, get_filter_service
from backend.app.db.duckdb import DuckDBManager
from backend.app.schemas.filters import FilterOptionsResponse
from backend.app.services.filter_service import FilterService

router = APIRouter(prefix="", tags=["filters"])


@router.get("/filters", response_model=FilterOptionsResponse)
def get_filters(
    db: DuckDBManager = Depends(get_db_manager),
) -> FilterOptionsResponse:
    service = get_filter_service(db)
    return FilterOptionsResponse(**service.get_filters())
