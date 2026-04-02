from __future__ import annotations

from pathlib import Path

import numpy as np
import polars as pl
from sklearn.ensemble import IsolationForest

from pipeline.common import ensure_parent, load_parquet


def _normalize(series: np.ndarray) -> np.ndarray:
    finite = np.nan_to_num(series.astype(float), nan=0.0, posinf=0.0, neginf=0.0)
    min_v = finite.min() if finite.size else 0.0
    max_v = finite.max() if finite.size else 0.0
    if max_v - min_v == 0:
        return np.zeros_like(finite)
    return (finite - min_v) / (max_v - min_v)


def score_anomalies(input_path: Path, output_path: Path) -> pl.DataFrame:
    """Compute explainable anomaly signals and a combined anomaly score."""
    df = load_parquet(input_path)
    pdf = df.to_pandas()

    numeric_features = [
        "CLAIM_AMOUNT_PAID",
        "PREMIUM_AMOUNT_PAID",
        "claim_to_premium_ratio",
        "claim_residual",
        "peer_group_zscore",
        "warranty_avg_claim",
        "region_avg_claim",
        "brand_avg_claim",
        "segment_concentration_share",
    ]
    model_df = pdf[numeric_features].fillna(0.0)

    if len(model_df) >= 5:
        iso = IsolationForest(n_estimators=100, contamination=0.08, random_state=42)
        iso.fit(model_df)
        isolation_forest_score = -iso.score_samples(model_df)
    else:
        isolation_forest_score = np.zeros(len(model_df))

    pdf["isolation_forest_score"] = isolation_forest_score
    pdf["residual_rank"] = pdf["claim_residual"].abs().rank(method="average", pct=True).fillna(0.0)

    z_component = _normalize(pdf["peer_group_zscore"].abs().to_numpy())
    iso_component = _normalize(pdf["isolation_forest_score"].to_numpy())
    residual_component = _normalize(pdf["claim_residual"].abs().to_numpy())

    pdf["anomaly_score"] = 0.45 * z_component + 0.30 * iso_component + 0.25 * residual_component
    threshold = max(float(np.quantile(pdf["anomaly_score"], 0.92)), 0.65)
    pdf["anomaly_flag"] = pdf["anomaly_score"] >= threshold

    reasons = []
    for _, row in pdf.iterrows():
        claim_reasons = []
        if abs(row.get("claim_residual", 0) or 0) > max(1000, abs(row.get("peer_group_expected_claim", 0) or 0) * 0.75):
            claim_reasons.append("claim amount far above peer-group expectation")
        if abs(row.get("peer_group_zscore", 0) or 0) >= 2.5:
            claim_reasons.append("extreme peer-group z-score")
        if (row.get("claim_to_premium_ratio") or 0) >= 5:
            claim_reasons.append("extreme claim-to-premium ratio within warranty")
        if (row.get("segment_concentration_share") or 1) <= 0.03:
            claim_reasons.append("rare segment combination")
        if (row.get("isolation_forest_score") or 0) >= np.quantile(pdf["isolation_forest_score"], 0.9):
            claim_reasons.append("high isolation score")
        if not claim_reasons:
            claim_reasons.append("combined anomaly score above threshold")
        reasons.append("; ".join(dict.fromkeys(claim_reasons)))

    pdf["anomaly_reason_summary"] = reasons
    out = pl.from_pandas(pdf)
    ensure_parent(output_path)
    out.write_parquet(output_path)
    return out
