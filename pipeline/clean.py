from __future__ import annotations

from pathlib import Path

import polars as pl

from pipeline.common import ensure_parent, load_parquet


PROVINCE_REGION_MAP = {
    "GAUTENG": "GAUTENG",
    "WESTERN CAPE": "WESTERN CAPE",
    "KWAZULU-NATAL": "KWAZULU-NATAL",
    "EASTERN CAPE": "EASTERN CAPE",
    "FREE STATE": "FREE STATE",
    "LIMPOPO": "LIMPOPO",
    "MPUMALANGA": "MPUMALANGA",
    "NORTH WEST": "NORTH WEST",
    "NORTHERN CAPE": "NORTHERN CAPE",
}


def clean_claims(input_path: Path, output_path: Path) -> pl.DataFrame:
    """Clean text, preserve original values, create flags, and impute missing geography."""
    df = load_parquet(input_path)

    text_cols = ["POLICYHOLDER_GENDER", "WARRANTY", "CLAIM_REGION", "CLAIM_PROVINCE", "VEHICLE_BRAND", "VEHICLE_MODEL"]
    for col in text_cols:
        df = df.with_columns(
            pl.when(pl.col(col).cast(pl.Utf8).str.strip_chars() == "")
            .then(None)
            .otherwise(pl.col(col).cast(pl.Utf8).str.strip_chars().str.to_uppercase())
            .alias(col)
        )

    df = df.with_columns(
        pl.col("POLICYHOLDER_AGE").alias("POLICYHOLDER_AGE_ORIGINAL"),
        ((pl.col("POLICYHOLDER_AGE") < 18) | (pl.col("POLICYHOLDER_AGE") > 100) | (pl.col("POLICYHOLDER_AGE") < 0)).fill_null(True).alias("is_age_invalid"),
        (pl.col("CLAIM_REGION").is_null() | pl.col("CLAIM_PROVINCE").is_null()).alias("is_geo_missing"),
        (pl.col("VEHICLE_BRAND").is_null() | pl.col("VEHICLE_MODEL").is_null()).alias("is_vehicle_info_missing"),
    )

    df = df.with_columns(
        pl.when(pl.col("is_age_invalid")).then(None).otherwise(pl.col("POLICYHOLDER_AGE")).alias("POLICYHOLDER_AGE")
    )

    df = df.with_columns(
        pl.when(pl.col("CLAIM_REGION").is_null())
        .then(
            pl.col("CLAIM_PROVINCE").replace(PROVINCE_REGION_MAP, default=None)
        )
        .otherwise(pl.col("CLAIM_REGION"))
        .alias("CLAIM_REGION")
    ).with_columns(
        (pl.col("CLAIM_REGION").is_null() | pl.col("CLAIM_PROVINCE").is_null()).alias("is_geo_missing")
    )

    dedupe_subset = [c for c in df.columns if c != "CLAIM_ID"]
    dup_counts = df.group_by(dedupe_subset).len().rename({"len": "duplicate_group_size"})
    df = df.join(dup_counts, on=dedupe_subset, how="left").with_columns(
        (pl.col("duplicate_group_size") > 1).fill_null(False).alias("is_duplicate_like")
    )

    ensure_parent(output_path)
    df.write_parquet(output_path)
    return df
