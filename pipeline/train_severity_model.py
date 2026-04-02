from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import ElasticNet
from sklearn.metrics import mean_absolute_error, median_absolute_error, r2_score, root_mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

try:
    import joblib
except Exception:  # pragma: no cover
    joblib = None

try:
    import lightgbm as lgb  # optional dependency
    _LGB_AVAILABLE = True
except Exception:  # pragma: no cover
    lgb = None
    _LGB_AVAILABLE = False

from pipeline.common import ensure_parent


def train_severity_benchmark(
    featured_parquet: Path,
    output_dir: Path = Path("data/processed/model"),
) -> dict:
    """Train an optional severity benchmark model scaffold."""
    ensure_parent(output_dir / "placeholder")
    df = pd.read_parquet(featured_parquet)

    target = "CLAIM_AMOUNT_PAID"
    feature_cols = [
        "WARRANTY", "claim_year", "claim_month", "claim_quarter", "claim_season",
        "CLAIM_REGION", "CLAIM_PROVINCE", "age_bucket", "POLICYHOLDER_GENDER",
        "VEHICLE_BRAND", "VEHICLE_MODEL", "PREMIUM_AMOUNT_PAID",
        "warranty_avg_claim", "region_avg_claim", "province_avg_claim",
        "brand_avg_claim", "model_avg_claim", "brand_model_avg_claim",
    ]
    baseline = df.groupby("WARRANTY")[target].median().rename("baseline_pred")
    baseline_pred = df["WARRANTY"].map(baseline).fillna(df[target].median())

    X = df[feature_cols].copy()
    y = df[target].astype(float)
    X_train, X_test, y_train, y_test, base_train, base_test = train_test_split(
        X, y, baseline_pred, test_size=0.25, random_state=42
    )

    categorical = X.select_dtypes(include=["object"]).columns.tolist()
    numeric = [c for c in feature_cols if c not in categorical]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore"))]), categorical),
            ("num", Pipeline([("imputer", SimpleImputer(strategy="median"))]), numeric),
        ]
    )

    models = {
        "elastic_net": ElasticNet(alpha=0.1, l1_ratio=0.2, random_state=42, max_iter=5000),
        "random_forest": RandomForestRegressor(n_estimators=250, random_state=42, n_jobs=-1),
        "hist_gradient_boosting": HistGradientBoostingRegressor(random_state=42),
    }
    if _LGB_AVAILABLE:
        models["lightgbm"] = lgb.LGBMRegressor(n_estimators=300, learning_rate=0.05, random_state=42, n_jobs=-1, verbose=-1)

    metrics = {}
    best_name = None
    best_mae = float("inf")
    best_pipeline = None

    baseline_metrics = {
        "mae": float(mean_absolute_error(y_test, base_test)),
        "rmse": float(root_mean_squared_error(y_test, base_test)),
        "medae": float(median_absolute_error(y_test, base_test)),
        "r2": float(r2_score(y_test, base_test)),
    }
    metrics["baseline_median_by_warranty"] = baseline_metrics

    for name, model in models.items():
        pipe = Pipeline([("preprocessor", preprocessor), ("model", model)])
        pipe.fit(X_train, y_train)
        preds = pipe.predict(X_test)
        result = {
            "mae": float(mean_absolute_error(y_test, preds)),
            "rmse": float(root_mean_squared_error(y_test, preds)),
            "medae": float(median_absolute_error(y_test, preds)),
            "r2": float(r2_score(y_test, preds)),
        }
        metrics[name] = result
        if result["mae"] < best_mae:
            best_mae = result["mae"]
            best_name = name
            best_pipeline = pipe

    (output_dir / "severity_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    (output_dir / "severity_features.json").write_text(json.dumps(feature_cols, indent=2), encoding="utf-8")
    (output_dir / "README.txt").write_text(
        "Severity model scaffold. Predicts paid claim amount as a benchmark only. "
        "Not pricing, underwriting, or business truth. Use for relative comparison and explainable benchmarking.",
        encoding="utf-8",
    )
    if joblib is not None and best_pipeline is not None:
        joblib.dump(best_pipeline, output_dir / "severity_model.joblib")
    return {"best_model": best_name, "metrics": metrics}


if __name__ == "__main__":
    train_severity_benchmark(Path("data/processed/claims_featured.parquet"))
