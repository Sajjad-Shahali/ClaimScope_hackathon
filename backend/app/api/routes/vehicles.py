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


from fastapi import Path, Query

from backend.app.api.deps import get_vehicle_service
from backend.app.schemas.vehicles import BrandDetailResponse, ModelSearchResponse, VehicleOverviewResponse

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("/overview", response_model=VehicleOverviewResponse)
def vehicle_overview(
    filters: dict = Depends(parse_common_filters),
    db: DuckDBManager = Depends(get_db_manager),
) -> VehicleOverviewResponse:
    service = get_vehicle_service(db)
    return VehicleOverviewResponse(**service.get_overview(filters))


@router.get("/brands/{brand_name}", response_model=BrandDetailResponse)
def brand_detail(
    brand_name: str = Path(...),
    filters: dict = Depends(parse_common_filters),
    db: DuckDBManager = Depends(get_db_manager),
) -> BrandDetailResponse:
    service = get_vehicle_service(db)
    return BrandDetailResponse(**service.get_brand_detail(brand_name, filters))


@router.get("/models/search", response_model=ModelSearchResponse)
def search_models(
    q: str = Query(..., min_length=1),
    db: DuckDBManager = Depends(get_db_manager),
) -> ModelSearchResponse:
    service = get_vehicle_service(db)
    return ModelSearchResponse(**service.search_models(q))
