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


from fastapi import Query

from backend.app.api.deps import get_anomaly_service
from backend.app.schemas.anomalies import AnomalyListResponse, AnomalySummaryResponse

router = APIRouter(prefix="/anomalies", tags=["anomalies"])


@router.get("", response_model=AnomalyListResponse)
def get_anomalies(
    filters: dict = Depends(parse_common_filters),
    min_anomaly_score: float | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=200),
    db: DuckDBManager = Depends(get_db_manager),
) -> AnomalyListResponse:
    filters["min_anomaly_score"] = min_anomaly_score
    service = get_anomaly_service(db)
    return AnomalyListResponse(**service.get_anomalies(filters, page, page_size))


@router.get("/summary", response_model=AnomalySummaryResponse)
def get_anomaly_summary(
    filters: dict = Depends(parse_common_filters),
    min_anomaly_score: float | None = Query(default=None),
    db: DuckDBManager = Depends(get_db_manager),
) -> AnomalySummaryResponse:
    filters["min_anomaly_score"] = min_anomaly_score
    service = get_anomaly_service(db)
    return AnomalySummaryResponse(**service.get_summary(filters))
