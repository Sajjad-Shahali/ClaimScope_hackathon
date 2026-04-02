from __future__ import annotations

from pathlib import Path

import polars as pl

from pipeline.common import ensure_parent, load_parquet, write_json


def build_validation_report(input_path: Path, report_path: Path, summary_path: Path) -> dict:
    """Create validation outputs for the ingested dataset."""
    df = load_parquet(input_path)

    duplicate_like = (
        df.drop("CLAIM_ID")
        .group_by(df.columns[:-1] if df.columns[-1] == "CLAIM_ID" else [c for c in df.columns if c != "CLAIM_ID"])
        .len()
        .filter(pl.col("len") > 1)
        .height
    )
    province_region = (
        df.filter(pl.col("CLAIM_PROVINCE").is_not_null() & pl.col("CLAIM_REGION").is_not_null())
        .group_by("CLAIM_PROVINCE")
        .agg(pl.n_unique("CLAIM_REGION").alias("region_count"))
        .filter(pl.col("region_count") > 1)
        .height
    )

    warranty_premium_consistency = (
        df.group_by("WARRANTY")
        .agg(
            pl.col("PREMIUM_AMOUNT_PAID").n_unique().alias("unique_premium_values"),
            pl.col("PREMIUM_AMOUNT_PAID").std().alias("premium_std"),
        )
        .sort("unique_premium_values", descending=True)
    )

    report = {
        "row_count": df.height,
        "unique_claim_id_count": df["CLAIM_ID"].n_unique(),
        "null_counts_by_column": {col: int(df[col].null_count()) for col in df.columns},
        "negative_ages": int(df.filter(pl.col("POLICYHOLDER_AGE") < 0).height),
        "ages_below_18": int(df.filter(pl.col("POLICYHOLDER_AGE") < 18).height),
        "ages_above_100": int(df.filter(pl.col("POLICYHOLDER_AGE") > 100).height),
        "date_parsing_failures": int(df["CLAIM_DATE"].null_count()),
        "duplicate_like_rows_excluding_claim_id": int(duplicate_like),
        "premium_to_warranty_consistency": warranty_premium_consistency.to_dicts(),
        "province_to_region_mapping_inconsistencies": int(province_region),
        "suspicious_capped_claims_at_10000": int(df.filter(pl.col("CLAIM_AMOUNT_PAID") == 10000).height),
        "category_cardinality_summary": {
            col: int(df[col].n_unique())
            for col in ["WARRANTY", "CLAIM_REGION", "CLAIM_PROVINCE", "VEHICLE_BRAND", "VEHICLE_MODEL"]
        },
    }

    summary = pl.DataFrame(
        {
            "check_name": list(report.keys()),
            "value": [str(v) for v in report.values()],
        }
    )

    ensure_parent(report_path)
    ensure_parent(summary_path)
    write_json(report_path, report)
    summary.write_parquet(summary_path)
    return report
