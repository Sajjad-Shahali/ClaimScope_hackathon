from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import duckdb
import polars as pl

from pipeline.common import ensure_parent, load_parquet


def _segment_metrics(df: pl.DataFrame, group_cols: list[str]) -> pl.DataFrame:
    total_paid = float(df["CLAIM_AMOUNT_PAID"].sum() or 0.0)
    return df.group_by(group_cols).agg(
        pl.len().alias("claim_count"),
        pl.sum("CLAIM_AMOUNT_PAID").alias("total_claim_paid"),
        pl.mean("CLAIM_AMOUNT_PAID").alias("avg_claim_paid"),
        pl.median("CLAIM_AMOUNT_PAID").alias("median_claim_paid"),
        pl.mean("claim_to_premium_ratio").alias("avg_claim_to_premium_ratio"),
        pl.quantile("CLAIM_AMOUNT_PAID", 0.95).alias("p95_claim_paid"),
        pl.col("high_cost_flag").cast(pl.Float64).mean().alias("high_cost_share"),
        pl.std("CLAIM_AMOUNT_PAID").alias("volatility"),
    ).with_columns(
        (pl.col("total_claim_paid") / total_paid if total_paid else 0.0).alias("concentration_share")
    )


def build_marts(input_path: Path, marts_dir: Path, duckdb_path: Path) -> None:
    """Create analytics marts and load them into DuckDB."""
    df = load_parquet(input_path).with_columns(
        pl.lit(datetime.now(timezone.utc)).alias("data_loaded_at")
    )
    ensure_parent(marts_dir / "placeholder")
    ensure_parent(duckdb_path)

    kpi_mart = pl.DataFrame([{
        "total_claims": df.height,
        "total_amount_paid": float(df["CLAIM_AMOUNT_PAID"].sum() or 0.0),
        "avg_claim_paid": float(df["CLAIM_AMOUNT_PAID"].mean() or 0.0),
        "median_claim_paid": float(df["CLAIM_AMOUNT_PAID"].median() or 0.0),
        "p95_claim_paid": float(df["CLAIM_AMOUNT_PAID"].quantile(0.95) or 0.0),
        "p99_claim_paid": float(df["CLAIM_AMOUNT_PAID"].quantile(0.99) or 0.0),
        "avg_claim_to_premium_ratio": float(df["claim_to_premium_ratio"].mean() or 0.0),
        "median_claim_to_premium_ratio": float(df["claim_to_premium_ratio"].median() or 0.0),
        "high_cost_claim_rate": float(df["high_cost_flag"].cast(pl.Float64).mean() or 0.0),
        "anomaly_count": int(df["anomaly_flag"].sum() or 0),
        "anomaly_rate": float(df["anomaly_flag"].cast(pl.Float64).mean() or 0.0),
        "data_loaded_at": datetime.now(timezone.utc),
    }])
    warranty_mart = _segment_metrics(df, ["WARRANTY"]).rename({"WARRANTY": "warranty"})
    geography_region = _segment_metrics(df, ["CLAIM_REGION"]).rename({"CLAIM_REGION": "claim_region"}).with_columns(pl.lit("region").alias("geography_type"), pl.lit(None).cast(pl.Utf8).alias("claim_province"))
    geography_province = _segment_metrics(df, ["CLAIM_PROVINCE"]).rename({"CLAIM_PROVINCE": "claim_province"}).with_columns(pl.lit("province").alias("geography_type"), pl.lit(None).cast(pl.Utf8).alias("claim_region"))
    geography_mart = pl.concat([geography_region, geography_province], how="diagonal")
    vehicle_brand = _segment_metrics(df, ["VEHICLE_BRAND"]).rename({"VEHICLE_BRAND": "vehicle_brand"}).with_columns(pl.lit("brand").alias("vehicle_level"), pl.lit(None).cast(pl.Utf8).alias("vehicle_model"))
    vehicle_model = _segment_metrics(df, ["VEHICLE_MODEL"]).rename({"VEHICLE_MODEL": "vehicle_model"}).with_columns(pl.lit("model").alias("vehicle_level"), pl.lit(None).cast(pl.Utf8).alias("vehicle_brand"))
    vehicle_mart = pl.concat([vehicle_brand, vehicle_model], how="diagonal")

    anomaly_mart = df.select([
        "CLAIM_ID", "CLAIM_DATE", "WARRANTY", "CLAIM_REGION", "VEHICLE_BRAND",
        "CLAIM_AMOUNT_PAID", "anomaly_score", "anomaly_flag", "anomaly_reason_summary",
        "data_loaded_at",
    ]).rename({
        "CLAIM_ID": "claim_id",
        "CLAIM_DATE": "claim_date",
        "WARRANTY": "warranty",
        "CLAIM_REGION": "claim_region",
        "VEHICLE_BRAND": "vehicle_brand",
        "CLAIM_AMOUNT_PAID": "claim_amount_paid",
        "anomaly_reason_summary": "anomaly_reasons",
    })

    claim_detail_mart = df.rename({
        "CLAIM_ID": "claim_id",
        "POLICYHOLDER_AGE": "policyholder_age",
        "POLICYHOLDER_AGE_ORIGINAL": "policyholder_age_original",
        "POLICYHOLDER_GENDER": "policyholder_gender",
        "WARRANTY": "warranty",
        "CLAIM_DATE": "claim_date",
        "CLAIM_REGION": "claim_region",
        "CLAIM_PROVINCE": "claim_province",
        "VEHICLE_BRAND": "vehicle_brand",
        "VEHICLE_MODEL": "vehicle_model",
        "CLAIM_AMOUNT_PAID": "claim_amount_paid",
        "PREMIUM_AMOUNT_PAID": "premium_amount_paid",
    })

    trend_mart = df.group_by(["claim_year_month", "WARRANTY"]).agg(
        pl.len().alias("claim_count"),
        pl.sum("CLAIM_AMOUNT_PAID").alias("total_claim_paid"),
        pl.mean("CLAIM_AMOUNT_PAID").alias("avg_claim_paid"),
        pl.mean("claim_to_premium_ratio").alias("avg_claim_to_premium_ratio"),
        pl.col("anomaly_flag").cast(pl.Float64).mean().alias("anomaly_rate"),
    ).rename({"WARRANTY": "warranty"})

    outputs = {
        "kpi_mart.parquet": kpi_mart,
        "warranty_mart.parquet": warranty_mart,
        "geography_mart.parquet": geography_mart,
        "vehicle_mart.parquet": vehicle_mart,
        "anomaly_mart.parquet": anomaly_mart,
        "claim_detail_mart.parquet": claim_detail_mart,
        "trend_mart.parquet": trend_mart,
    }

    for name, frame in outputs.items():
        frame.write_parquet(marts_dir / name)

    conn = duckdb.connect(str(duckdb_path))
    try:
        for name in outputs:
            table_name = name.replace(".parquet", "")
            conn.execute(f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM read_parquet('{(marts_dir / name).as_posix()}')")
    finally:
        conn.close()
