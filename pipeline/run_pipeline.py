from __future__ import annotations

from pathlib import Path

from backend.app.core.config import get_settings
from pipeline.anomaly import score_anomalies
from pipeline.clean import clean_claims
from pipeline.features import build_features
from pipeline.ingest import ingest_claims
from pipeline.marts import build_marts
from pipeline.validate import build_validation_report


def main() -> None:
    settings = get_settings()
    raw_data_path = settings.raw_data_path
    processed_dir = Path("data/processed")
    marts_dir = Path("data/marts")
    duckdb_path = settings.duckdb_path

    ingest_claims(raw_data_path, processed_dir / "raw_claims.parquet")
    build_validation_report(
        processed_dir / "raw_claims.parquet",
        processed_dir / "validation_report.json",
        processed_dir / "validation_summary.parquet",
    )
    clean_claims(processed_dir / "raw_claims.parquet", processed_dir / "claims_cleaned.parquet")
    build_features(processed_dir / "claims_cleaned.parquet", processed_dir / "claims_featured.parquet")
    score_anomalies(processed_dir / "claims_featured.parquet", processed_dir / "claims_anomaly.parquet")
    build_marts(processed_dir / "claims_anomaly.parquet", marts_dir, duckdb_path)


if __name__ == "__main__":
    main()
