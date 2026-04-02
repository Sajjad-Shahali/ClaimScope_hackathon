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


from fastapi import Path

from backend.app.api.deps import get_warranty_service
from backend.app.schemas.warranties import (
    WarrantyDetailResponse,
    WarrantyOverviewResponse,
    WarrantyTrendResponse,
)
from backend.app.services.warranty_service import WarrantyService

router = APIRouter(prefix="/warranties", tags=["warranties"])


@router.get("/overview", response_model=WarrantyOverviewResponse)
def get_warranty_overview(
    filters: dict = Depends(parse_common_filters),
    db: DuckDBManager = Depends(get_db_manager),
) -> WarrantyOverviewResponse:
    service = get_warranty_service(db)
    return WarrantyOverviewResponse(**service.get_overview(filters))


@router.get("/trend", response_model=WarrantyTrendResponse)
def get_warranty_trend(
    filters: dict = Depends(parse_common_filters),
    db: DuckDBManager = Depends(get_db_manager),
) -> WarrantyTrendResponse:
    service = get_warranty_service(db)
    return WarrantyTrendResponse(**service.get_trend(filters))


@router.get("/{warranty_name}", response_model=WarrantyDetailResponse)
def get_warranty_detail(
    warranty_name: str = Path(...),
    filters: dict = Depends(parse_common_filters),
    db: DuckDBManager = Depends(get_db_manager),
) -> WarrantyDetailResponse:
    service = get_warranty_service(db)
    return WarrantyDetailResponse(**service.get_detail(warranty_name, filters))
