from __future__ import annotations

from typing import Iterable


def safe_divide(numerator: float | int | None, denominator: float | int | None) -> float | None:
    """Return division result or None when denominator is zero-like."""
    if numerator is None or denominator in (None, 0):
        return None
    return float(numerator) / float(denominator)


def null_safe_mean(values: Iterable[float | None]) -> float | None:
    """Average non-null values."""
    materialized = [v for v in values if v is not None]
    if not materialized:
        return None
    return sum(materialized) / len(materialized)
