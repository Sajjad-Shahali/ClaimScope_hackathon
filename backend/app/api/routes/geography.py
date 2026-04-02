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

from backend.app.api.deps import get_geography_service
from backend.app.schemas.geography import (
    GeographyDetailResponse,
    GeographyOverviewResponse,
    GeographyTrendResponse,
)

router = APIRouter(prefix="/geography", tags=["geography"])


@router.get("/overview", response_model=GeographyOverviewResponse)
def geography_overview(
    filters: dict = Depends(parse_common_filters),
    db: DuckDBManager = Depends(get_db_manager),
) -> GeographyOverviewResponse:
    service = get_geography_service(db)
    return GeographyOverviewResponse(**service.get_overview(filters))


@router.get("/trend", response_model=GeographyTrendResponse)
def geography_trend(
    filters: dict = Depends(parse_common_filters),
    db: DuckDBManager = Depends(get_db_manager),
) -> GeographyTrendResponse:
    service = get_geography_service(db)
    return GeographyTrendResponse(**service.get_trend(filters))


@router.get("/region/{region_name}", response_model=GeographyDetailResponse)
def region_detail(
    region_name: str = Path(...),
    filters: dict = Depends(parse_common_filters),
    db: DuckDBManager = Depends(get_db_manager),
) -> GeographyDetailResponse:
    service = get_geography_service(db)
    return GeographyDetailResponse(**service.get_region_detail(region_name, filters))


@router.get("/province/{province_name}", response_model=GeographyDetailResponse)
def province_detail(
    province_name: str = Path(...),
    filters: dict = Depends(parse_common_filters),
    db: DuckDBManager = Depends(get_db_manager),
) -> GeographyDetailResponse:
    service = get_geography_service(db)
    return GeographyDetailResponse(**service.get_province_detail(province_name, filters))
