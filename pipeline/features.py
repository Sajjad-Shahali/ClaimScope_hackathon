from __future__ import annotations

from pathlib import Path

import polars as pl

from pipeline.common import ensure_parent, load_parquet


def _season_expr(month_col: str) -> pl.Expr:
    return (
        pl.when(pl.col(month_col).is_in([12, 1, 2])).then(pl.lit("SUMMER"))
        .when(pl.col(month_col).is_in([3, 4, 5])).then(pl.lit("AUTUMN"))
        .when(pl.col(month_col).is_in([6, 7, 8])).then(pl.lit("WINTER"))
        .when(pl.col(month_col).is_in([9, 10, 11])).then(pl.lit("SPRING"))
        .otherwise(pl.lit("UNKNOWN"))
    )


def build_features(input_path: Path, output_path: Path) -> pl.DataFrame:
    """Engineer explainable analytic and peer-group features."""
    df = load_parquet(input_path)

    df = df.with_columns(
        pl.col("CLAIM_DATE").dt.year().alias("claim_year"),
        pl.col("CLAIM_DATE").dt.month().alias("claim_month"),
        pl.col("CLAIM_DATE").dt.quarter().alias("claim_quarter"),
        pl.col("CLAIM_DATE").dt.weekday().alias("claim_weekday"),
        pl.col("CLAIM_DATE").dt.strftime("%Y-%m").alias("claim_year_month"),
    ).with_columns(
        _season_expr("claim_month").alias("claim_season"),
        pl.when(pl.col("POLICYHOLDER_AGE").is_null()).then(pl.lit("UNKNOWN"))
        .when(pl.col("POLICYHOLDER_AGE") < 25).then(pl.lit("18-24"))
        .when(pl.col("POLICYHOLDER_AGE") < 35).then(pl.lit("25-34"))
        .when(pl.col("POLICYHOLDER_AGE") < 45).then(pl.lit("35-44"))
        .when(pl.col("POLICYHOLDER_AGE") < 55).then(pl.lit("45-54"))
        .when(pl.col("POLICYHOLDER_AGE") < 65).then(pl.lit("55-64"))
        .otherwise(pl.lit("65+"))
        .alias("age_bucket"),
        (pl.col("CLAIM_AMOUNT_PAID") / pl.when(pl.col("PREMIUM_AMOUNT_PAID") > 0).then(pl.col("PREMIUM_AMOUNT_PAID")).otherwise(None)).alias("claim_to_premium_ratio"),
    )

    df = df.with_columns(
        pl.when(pl.col("CLAIM_AMOUNT_PAID") >= 10000).then(pl.lit("VERY_HIGH"))
        .when(pl.col("CLAIM_AMOUNT_PAID") >= 5000).then(pl.lit("HIGH"))
        .when(pl.col("CLAIM_AMOUNT_PAID") >= 2000).then(pl.lit("MEDIUM"))
        .otherwise(pl.lit("LOW"))
        .alias("claim_severity_band"),
        pl.when(pl.col("PREMIUM_AMOUNT_PAID") >= 2000).then(pl.lit("HIGH"))
        .when(pl.col("PREMIUM_AMOUNT_PAID") >= 1000).then(pl.lit("MEDIUM"))
        .otherwise(pl.lit("LOW"))
        .alias("premium_band"),
    )

    high_cost_threshold = float(df["CLAIM_AMOUNT_PAID"].quantile(0.95, interpolation="nearest") or 0)
    extreme_ratio_threshold = float(df["claim_to_premium_ratio"].drop_nulls().quantile(0.95, interpolation="nearest") or 0)
    df = df.with_columns(
        (pl.col("CLAIM_AMOUNT_PAID") >= high_cost_threshold).alias("high_cost_flag"),
        (pl.col("claim_to_premium_ratio") >= extreme_ratio_threshold).fill_null(False).alias("extreme_ratio_flag"),
    )

    group_defs = {
        "warranty": ["WARRANTY"],
        "region": ["CLAIM_REGION"],
        "province": ["CLAIM_PROVINCE"],
        "brand": ["VEHICLE_BRAND"],
        "model": ["VEHICLE_MODEL"],
        "brand_model": ["VEHICLE_BRAND", "VEHICLE_MODEL"],
        "warranty_region": ["WARRANTY", "CLAIM_REGION"],
    }
    for prefix, cols in group_defs.items():
        agg = df.group_by(cols).agg(
            pl.mean("CLAIM_AMOUNT_PAID").alias(f"{prefix}_avg_claim"),
            pl.len().alias(f"{prefix}_claim_count"),
            pl.mean("claim_to_premium_ratio").alias(f"{prefix}_avg_ratio"),
        )
        df = df.join(agg, on=cols, how="left")

    total_claims = max(df.height, 1)
    share = df.group_by(["WARRANTY", "CLAIM_REGION"]).len().with_columns(
        (pl.col("len") / total_claims).alias("segment_concentration_share")
    ).drop("len")
    df = df.join(share, on=["WARRANTY", "CLAIM_REGION"], how="left")

    df = df.with_columns(
        pl.concat_str(
            [
                pl.col("WARRANTY").fill_null("UNK"),
                pl.col("CLAIM_REGION").fill_null("UNK"),
                pl.col("VEHICLE_BRAND").fill_null("UNK"),
                pl.col("age_bucket").fill_null("UNK"),
            ],
            separator="|",
        ).alias("peer_group_key")
    )

    peer_stats = df.group_by("peer_group_key").agg(
        pl.mean("CLAIM_AMOUNT_PAID").alias("peer_group_expected_claim"),
        pl.std("CLAIM_AMOUNT_PAID").alias("peer_group_claim_std"),
        pl.median("CLAIM_AMOUNT_PAID").alias("peer_group_median_claim"),
        pl.quantile("CLAIM_AMOUNT_PAID", 0.75).alias("peer_q75"),
        pl.quantile("CLAIM_AMOUNT_PAID", 0.25).alias("peer_q25"),
    )
    df = df.join(peer_stats, on="peer_group_key", how="left").with_columns(
        (pl.col("CLAIM_AMOUNT_PAID") - pl.col("peer_group_expected_claim")).alias("claim_residual"),
    ).with_columns(
        pl.when(pl.col("peer_group_claim_std") > 0)
        .then((pl.col("CLAIM_AMOUNT_PAID") - pl.col("peer_group_expected_claim")) / pl.col("peer_group_claim_std"))
        .otherwise(0.0)
        .alias("peer_group_zscore"),
        (((pl.col("CLAIM_AMOUNT_PAID").rank("average").over("peer_group_key") - 1) / (pl.len().over("peer_group_key") - 1))
            .fill_nan(0.5)
            .fill_null(0.5)
         ).alias("peer_group_percentile"),
    )

    ensure_parent(output_path)
    df.write_parquet(output_path)
    return df
