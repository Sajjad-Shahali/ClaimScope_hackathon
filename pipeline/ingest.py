from __future__ import annotations

from pathlib import Path

import pandas as pd
import polars as pl

from pipeline.common import STANDARD_COLUMNS, ensure_parent, standardize_columns


def ingest_claims(raw_data_path: Path, output_path: Path) -> pl.DataFrame:
    """Load the Claim Excel sheet, standardize columns, coerce dtypes, and persist parquet."""
    ensure_parent(output_path)
    pdf = pd.read_excel(raw_data_path, sheet_name="Claim")
    pdf.columns = standardize_columns(list(pdf.columns))

    missing = [col for col in STANDARD_COLUMNS if col not in pdf.columns]
    if missing:
        raise ValueError(f"Missing expected columns: {missing}")

    pdf = pdf[STANDARD_COLUMNS].copy()
    pdf["CLAIM_DATE"] = pd.to_datetime(pdf["CLAIM_DATE"], errors="coerce")
    pdf["POLICYHOLDER_AGE"] = pd.to_numeric(pdf["POLICYHOLDER_AGE"], errors="coerce")
    pdf["CLAIM_AMOUNT_PAID"] = pd.to_numeric(pdf["CLAIM_AMOUNT_PAID"], errors="coerce")
    pdf["PREMIUM_AMOUNT_PAID"] = pd.to_numeric(pdf["PREMIUM_AMOUNT_PAID"], errors="coerce")
    pdf["CLAIM_ID"] = pdf["CLAIM_ID"].astype(str)

    df = pl.from_pandas(pdf)
    df.write_parquet(output_path)
    return df
