from datetime import date

from fastapi import APIRouter, Depends, Query

from backend.app.api.deps import get_db_manager
from backend.app.db.duckdb import DuckDBManager


def parse_common_filters(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    warranty: list[str] | None = Query(default=None),
    region: list[str] | None = Query(default=None),
    province: list[str] | None = Query(default=None),
    brand: list[str] | None = Query(default=None),
    model: list[str] | None = Query(default=None),
    age_bucket: list[str] | None = Query(default=None),
    gender: list[str] | None = Query(default=None),
    anomaly_only: bool = Query(default=False),
) -> dict:
    return {
        "start_date": start_date,
        "end_date": end_date,
        "warranty": warranty,
        "region": region,
        "province": province,
        "brand": brand,
        "model": model,
        "age_bucket": age_bucket,
        "gender": gender,
        "anomaly_only": anomaly_only,
    }


from backend.app.api.deps import get_kpi_service
from backend.app.schemas.kpis import KPIResponse
from backend.app.services.kpi_service import KPIService

router = APIRouter(prefix="", tags=["kpis"])


@router.get("/kpis", response_model=KPIResponse)
def get_kpis(
    filters: dict = Depends(parse_common_filters),
    db: DuckDBManager = Depends(get_db_manager),
) -> KPIResponse:
    service = get_kpi_service(db)
    return KPIResponse(**service.get_kpis(filters))
