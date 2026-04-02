from __future__ import annotations

from pathlib import Path

import duckdb
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from backend.app.core.config import get_settings
from backend.app.main import app


@pytest.fixture(scope="session")
def sample_df() -> pd.DataFrame:
    rows = [
        {"claim_id": "C001", "policyholder_age": 35, "policyholder_age_original": 35, "policyholder_gender": "M", "warranty": "POWERTRAIN", "claim_date": "2024-01-15", "claim_region": "GAUTENG", "claim_province": "GAUTENG", "vehicle_brand": "TOYOTA", "vehicle_model": "COROLLA", "claim_amount_paid": 1200.0, "premium_amount_paid": 800.0, "claim_to_premium_ratio": 1.5, "high_cost_flag": False, "anomaly_flag": False, "anomaly_score": 0.15, "anomaly_reason_summary": "", "age_bucket": "35-44", "claim_year": 2024, "claim_month": 1, "claim_quarter": 1, "claim_weekday": 1, "claim_season": "SUMMER", "claim_year_month": "2024-01", "claim_severity_band": "LOW", "premium_band": "LOW", "extreme_ratio_flag": False, "warranty_avg_claim": 4100.0, "warranty_claim_count": 3, "region_avg_claim": 2800.0, "province_avg_claim": 2800.0, "brand_avg_claim": 1433.0, "model_avg_claim": 2800.0, "brand_model_avg_claim": 2800.0, "warranty_region_avg_claim": 4100.0, "warranty_region_avg_ratio": 3.0, "segment_concentration_share": 0.4, "peer_group_key": "POWERTRAIN|GAUTENG|TOYOTA|35-44", "peer_group_expected_claim": 1200.0, "claim_residual": 0.0, "peer_group_zscore": 0.0, "peer_group_percentile": 0.5, "isolation_forest_score": 0.05, "residual_rank": 0.2, "data_loaded_at": "2026-04-01T00:00:00Z"},
        {"claim_id": "C002", "policyholder_age": 42, "policyholder_age_original": 42, "policyholder_gender": "F", "warranty": "POWERTRAIN", "claim_date": "2024-02-10", "claim_region": "GAUTENG", "claim_province": "GAUTENG", "vehicle_brand": "TOYOTA", "vehicle_model": "HILUX", "claim_amount_paid": 9800.0, "premium_amount_paid": 900.0, "claim_to_premium_ratio": 10.89, "high_cost_flag": True, "anomaly_flag": True, "anomaly_score": 0.98, "anomaly_reason_summary": "claim amount far above peer-group expectation; high isolation score", "age_bucket": "35-44", "claim_year": 2024, "claim_month": 2, "claim_quarter": 1, "claim_weekday": 6, "claim_season": "SUMMER", "claim_year_month": "2024-02", "claim_severity_band": "HIGH", "premium_band": "LOW", "extreme_ratio_flag": True, "warranty_avg_claim": 4100.0, "warranty_claim_count": 3, "region_avg_claim": 2800.0, "province_avg_claim": 2800.0, "brand_avg_claim": 1433.0, "model_avg_claim": 9800.0, "brand_model_avg_claim": 9800.0, "warranty_region_avg_claim": 4100.0, "warranty_region_avg_ratio": 3.0, "segment_concentration_share": 0.2, "peer_group_key": "POWERTRAIN|GAUTENG|TOYOTA|35-44", "peer_group_expected_claim": 1200.0, "claim_residual": 8600.0, "peer_group_zscore": 3.2, "peer_group_percentile": 1.0, "isolation_forest_score": 0.92, "residual_rank": 1.0, "data_loaded_at": "2026-04-01T00:00:00Z"},
        {"claim_id": "C003", "policyholder_age": 29, "policyholder_age_original": 29, "policyholder_gender": "M", "warranty": "SERVICE_PLAN", "claim_date": "2024-03-05", "claim_region": "WESTERN CAPE", "claim_province": "WESTERN CAPE", "vehicle_brand": "BMW", "vehicle_model": "X3", "claim_amount_paid": 3400.0, "premium_amount_paid": 1200.0, "claim_to_premium_ratio": 2.83, "high_cost_flag": False, "anomaly_flag": False, "anomaly_score": 0.35, "anomaly_reason_summary": "", "age_bucket": "25-34", "claim_year": 2024, "claim_month": 3, "claim_quarter": 1, "claim_weekday": 2, "claim_season": "AUTUMN", "claim_year_month": "2024-03", "claim_severity_band": "MEDIUM", "premium_band": "MEDIUM", "extreme_ratio_flag": False, "warranty_avg_claim": 2550.0, "warranty_claim_count": 2, "region_avg_claim": 3400.0, "province_avg_claim": 3400.0, "brand_avg_claim": 3400.0, "model_avg_claim": 3400.0, "brand_model_avg_claim": 3400.0, "warranty_region_avg_claim": 3400.0, "warranty_region_avg_ratio": 2.83, "segment_concentration_share": 0.2, "peer_group_key": "SERVICE_PLAN|WESTERN CAPE|BMW|25-34", "peer_group_expected_claim": 3400.0, "claim_residual": 0.0, "peer_group_zscore": 0.0, "peer_group_percentile": 0.5, "isolation_forest_score": 0.2, "residual_rank": 0.3, "data_loaded_at": "2026-04-01T00:00:00Z"},
        {"claim_id": "C004", "policyholder_age": 51, "policyholder_age_original": 51, "policyholder_gender": "F", "warranty": "SERVICE_PLAN", "claim_date": "2024-03-20", "claim_region": "WESTERN CAPE", "claim_province": "WESTERN CAPE", "vehicle_brand": "AUDI", "vehicle_model": "A4", "claim_amount_paid": 1700.0, "premium_amount_paid": 1100.0, "claim_to_premium_ratio": 1.55, "high_cost_flag": False, "anomaly_flag": False, "anomaly_score": 0.25, "anomaly_reason_summary": "", "age_bucket": "45-54", "claim_year": 2024, "claim_month": 3, "claim_quarter": 1, "claim_weekday": 3, "claim_season": "AUTUMN", "claim_year_month": "2024-03", "claim_severity_band": "LOW", "premium_band": "MEDIUM", "extreme_ratio_flag": False, "warranty_avg_claim": 2550.0, "warranty_claim_count": 2, "region_avg_claim": 3400.0, "province_avg_claim": 3400.0, "brand_avg_claim": 1700.0, "model_avg_claim": 1700.0, "brand_model_avg_claim": 1700.0, "warranty_region_avg_claim": 3400.0, "warranty_region_avg_ratio": 2.83, "segment_concentration_share": 0.2, "peer_group_key": "SERVICE_PLAN|WESTERN CAPE|AUDI|45-54", "peer_group_expected_claim": 1700.0, "claim_residual": 0.0, "peer_group_zscore": 0.0, "peer_group_percentile": 0.5, "isolation_forest_score": 0.1, "residual_rank": 0.1, "data_loaded_at": "2026-04-01T00:00:00Z"},
        {"claim_id": "C005", "policyholder_age": 67, "policyholder_age_original": 67, "policyholder_gender": "M", "warranty": "POWERTRAIN", "claim_date": "2024-04-01", "claim_region": "EASTERN CAPE", "claim_province": "EASTERN CAPE", "vehicle_brand": "FORD", "vehicle_model": "RANGER", "claim_amount_paid": 1300.0, "premium_amount_paid": 950.0, "claim_to_premium_ratio": 1.37, "high_cost_flag": False, "anomaly_flag": False, "anomaly_score": 0.12, "anomaly_reason_summary": "", "age_bucket": "65+", "claim_year": 2024, "claim_month": 4, "claim_quarter": 2, "claim_weekday": 1, "claim_season": "AUTUMN", "claim_year_month": "2024-04", "claim_severity_band": "LOW", "premium_band": "LOW", "extreme_ratio_flag": False, "warranty_avg_claim": 4100.0, "warranty_claim_count": 3, "region_avg_claim": 1300.0, "province_avg_claim": 1300.0, "brand_avg_claim": 1300.0, "model_avg_claim": 1300.0, "brand_model_avg_claim": 1300.0, "warranty_region_avg_claim": 1300.0, "warranty_region_avg_ratio": 1.37, "segment_concentration_share": 0.2, "peer_group_key": "POWERTRAIN|EASTERN CAPE|FORD|65+", "peer_group_expected_claim": 1300.0, "claim_residual": 0.0, "peer_group_zscore": 0.0, "peer_group_percentile": 0.5, "isolation_forest_score": 0.08, "residual_rank": 0.2, "data_loaded_at": "2026-04-01T00:00:00Z"},
    ]
    return pd.DataFrame(rows)


@pytest.fixture(scope="session")
def duckdb_path(tmp_path_factory, sample_df):
    path = tmp_path_factory.mktemp("db") / "test.duckdb"
    conn = duckdb.connect(str(path))
    sample_df.to_parquet(path.parent / "claim_detail_mart.parquet", index=False)

    conn.execute(f"CREATE TABLE claim_detail_mart AS SELECT * FROM read_parquet('{(path.parent / 'claim_detail_mart.parquet').as_posix()}')")
    conn.execute("""
        CREATE TABLE anomaly_mart AS
        SELECT claim_id, CAST(claim_date AS DATE) AS claim_date, warranty, claim_region, vehicle_brand,
               claim_amount_paid, anomaly_score, anomaly_flag, anomaly_reason_summary AS anomaly_reasons, data_loaded_at
        FROM claim_detail_mart
    """)
    conn.execute("""
        CREATE TABLE warranty_mart AS
        SELECT warranty,
               COUNT(*) AS claim_count,
               SUM(claim_amount_paid) AS total_claim_paid,
               AVG(claim_amount_paid) AS avg_claim_paid,
               MEDIAN(claim_amount_paid) AS median_claim_paid,
               AVG(claim_to_premium_ratio) AS avg_claim_to_premium_ratio,
               QUANTILE_CONT(claim_amount_paid, 0.95) AS p95_claim_paid,
               AVG(CASE WHEN high_cost_flag THEN 1.0 ELSE 0.0 END) AS high_cost_share,
               STDDEV_SAMP(claim_amount_paid) AS volatility,
               SUM(claim_amount_paid) / (SELECT SUM(claim_amount_paid) FROM claim_detail_mart) AS concentration_share
        FROM claim_detail_mart GROUP BY 1
    """)
    conn.execute("""
        CREATE TABLE geography_mart AS
        SELECT claim_region, NULL::VARCHAR AS claim_province, 'region' AS geography_type,
               COUNT(*) AS claim_count, SUM(claim_amount_paid) AS total_claim_paid, AVG(claim_amount_paid) AS avg_claim_paid,
               MEDIAN(claim_amount_paid) AS median_claim_paid, AVG(claim_to_premium_ratio) AS avg_claim_to_premium_ratio,
               QUANTILE_CONT(claim_amount_paid, 0.95) AS p95_claim_paid,
               AVG(CASE WHEN high_cost_flag THEN 1.0 ELSE 0.0 END) AS high_cost_share,
               STDDEV_SAMP(claim_amount_paid) AS volatility,
               SUM(claim_amount_paid) / (SELECT SUM(claim_amount_paid) FROM claim_detail_mart) AS concentration_share
        FROM claim_detail_mart GROUP BY 1
        UNION ALL
        SELECT NULL::VARCHAR AS claim_region, claim_province, 'province' AS geography_type,
               COUNT(*) AS claim_count, SUM(claim_amount_paid) AS total_claim_paid, AVG(claim_amount_paid) AS avg_claim_paid,
               MEDIAN(claim_amount_paid) AS median_claim_paid, AVG(claim_to_premium_ratio) AS avg_claim_to_premium_ratio,
               QUANTILE_CONT(claim_amount_paid, 0.95) AS p95_claim_paid,
               AVG(CASE WHEN high_cost_flag THEN 1.0 ELSE 0.0 END) AS high_cost_share,
               STDDEV_SAMP(claim_amount_paid) AS volatility,
               SUM(claim_amount_paid) / (SELECT SUM(claim_amount_paid) FROM claim_detail_mart) AS concentration_share
        FROM claim_detail_mart GROUP BY 2
    """)
    conn.execute("""
        CREATE TABLE vehicle_mart AS
        SELECT vehicle_brand, NULL::VARCHAR AS vehicle_model, 'brand' AS vehicle_level,
               COUNT(*) AS claim_count, SUM(claim_amount_paid) AS total_claim_paid, AVG(claim_amount_paid) AS avg_claim_paid,
               MEDIAN(claim_amount_paid) AS median_claim_paid, AVG(claim_to_premium_ratio) AS avg_claim_to_premium_ratio,
               QUANTILE_CONT(claim_amount_paid, 0.95) AS p95_claim_paid,
               AVG(CASE WHEN high_cost_flag THEN 1.0 ELSE 0.0 END) AS high_cost_share,
               STDDEV_SAMP(claim_amount_paid) AS volatility,
               SUM(claim_amount_paid) / (SELECT SUM(claim_amount_paid) FROM claim_detail_mart) AS concentration_share
        FROM claim_detail_mart GROUP BY 1
        UNION ALL
        SELECT NULL::VARCHAR AS vehicle_brand, vehicle_model, 'model' AS vehicle_level,
               COUNT(*) AS claim_count, SUM(claim_amount_paid) AS total_claim_paid, AVG(claim_amount_paid) AS avg_claim_paid,
               MEDIAN(claim_amount_paid) AS median_claim_paid, AVG(claim_to_premium_ratio) AS avg_claim_to_premium_ratio,
               QUANTILE_CONT(claim_amount_paid, 0.95) AS p95_claim_paid,
               AVG(CASE WHEN high_cost_flag THEN 1.0 ELSE 0.0 END) AS high_cost_share,
               STDDEV_SAMP(claim_amount_paid) AS volatility,
               SUM(claim_amount_paid) / (SELECT SUM(claim_amount_paid) FROM claim_detail_mart) AS concentration_share
        FROM claim_detail_mart GROUP BY 2
    """)
    conn.execute("""
        CREATE TABLE trend_mart AS
        SELECT claim_year_month, warranty,
               COUNT(*) AS claim_count,
               SUM(claim_amount_paid) AS total_claim_paid,
               AVG(claim_amount_paid) AS avg_claim_paid,
               AVG(claim_to_premium_ratio) AS avg_claim_to_premium_ratio,
               AVG(CASE WHEN anomaly_flag THEN 1.0 ELSE 0.0 END) AS anomaly_rate
        FROM claim_detail_mart GROUP BY 1,2
    """)
    conn.close()
    return path


@pytest.fixture(autouse=True)
def configure_env(monkeypatch, duckdb_path):
    monkeypatch.setenv("DUCKDB_PATH", str(duckdb_path))
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c
