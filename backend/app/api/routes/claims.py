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

from backend.app.api.deps import get_claim_service
from backend.app.schemas.claims import ClaimDetailResponse, ClaimsListResponse

router = APIRouter(prefix="/claims", tags=["claims"])


@router.get("", response_model=ClaimsListResponse)
def list_claims(
    filters: dict = Depends(parse_common_filters),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=200),
    sort_by: str = Query(default="claim_date"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    high_cost_only: bool = Query(default=False),
    db: DuckDBManager = Depends(get_db_manager),
) -> ClaimsListResponse:
    filters["high_cost_only"] = high_cost_only
    service = get_claim_service(db)
    return ClaimsListResponse(**service.get_claims(filters, page, page_size, sort_by, sort_order))


@router.get("/{claim_id}", response_model=ClaimDetailResponse)
def claim_detail(
    claim_id: str = Path(...),
    db: DuckDBManager = Depends(get_db_manager),
) -> ClaimDetailResponse:
    service = get_claim_service(db)
    return ClaimDetailResponse(**service.get_claim_detail(claim_id))
