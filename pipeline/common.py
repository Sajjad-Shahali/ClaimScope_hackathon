from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import polars as pl

STANDARD_COLUMNS = [
    "CLAIM_ID",
    "POLICYHOLDER_AGE",
    "POLICYHOLDER_GENDER",
    "WARRANTY",
    "CLAIM_DATE",
    "CLAIM_REGION",
    "CLAIM_PROVINCE",
    "VEHICLE_BRAND",
    "VEHICLE_MODEL",
    "CLAIM_AMOUNT_PAID",
    "PREMIUM_AMOUNT_PAID",
]


def standardize_columns(columns: list[str]) -> list[str]:
    result = []
    for col in columns:
        normalized = (
            str(col)
            .strip()
            .upper()
            .replace(" ", "_")
            .replace("-", "_")
            .replace("/", "_")
        )
        result.append(normalized)
    return result


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")


def load_parquet(path: str | Path) -> pl.DataFrame:
    return pl.read_parquet(str(path))
