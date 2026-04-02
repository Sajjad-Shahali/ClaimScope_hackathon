# ClaimScope — Data Pipeline

The ETL pipeline that transforms a raw Excel file of vehicle insurance claims into a fully-analysed DuckDB analytical database. It runs as a single command and produces all intermediate parquet files, anomaly scores, analytic mart tables, and the final `.duckdb` serving file consumed by the backend API.

---

## Pipeline overview

```
data/raw/claim.xlsx
        │
        ▼  1. ingest.py
data/processed/raw_claims.parquet
        │
        ▼  2. validate.py
data/processed/validation_report.json
data/processed/validation_summary.parquet
        │
        ▼  3. clean.py
data/processed/claims_cleaned.parquet
        │
        ▼  4. features.py
data/processed/claims_featured.parquet
        │
        ▼  5. anomaly.py
data/processed/claims_anomaly.parquet
        │
        ▼  6. marts.py
data/marts/*.parquet  +  data/duckdb/claimscope.duckdb
        │
        ▼  (optional) 7. train_severity_model.py
LightGBM severity benchmark artefacts
```

---

## Folder structure

```
pipeline/
├── __init__.py
├── run_pipeline.py          ← Single entry point — runs all 6 steps in order
├── common.py                ← Shared constants, column names, type helpers
├── ingest.py                ← Step 1: Excel → raw parquet
├── validate.py              ← Step 2: Data quality report
├── clean.py                 ← Step 3: Normalisation, type casting, flag columns
├── features.py              ← Step 4: Feature engineering for anomaly model
├── anomaly.py               ← Step 5: IsolationForest + z-score anomaly scoring
├── marts.py                 ← Step 6: Analytic mart parquets + DuckDB load
└── train_severity_model.py  ← Optional: LightGBM severity benchmark model
```

---

## Running the pipeline

```bash
# From the project root
python -m pipeline.run_pipeline
```

Expected output: 6 stages complete with no errors, DuckDB file written to `data/duckdb/`.

### Prerequisites

- Python virtual environment activated with `pip install -e ".[dev]"`
- Source data placed at `data/raw/claim.xlsx` (sheet name: `Claim`)

### Optional: severity model

```bash
pip install -e ".[dev,model]"   # installs LightGBM
python -m pipeline.train_severity_model
```

If LightGBM is not installed, the severity model step is silently skipped and the rest of the pipeline runs normally.

---

## Step-by-step description

### Step 1 — `ingest.py`
Reads `claim.xlsx` using Pandas (for openpyxl compatibility) and immediately converts to a Polars DataFrame. Writes `raw_claims.parquet` with no transformations — this is the exact source data in columnar format.

**Input:** `data/raw/claim.xlsx` (sheet: `Claim`)  
**Output:** `data/processed/raw_claims.parquet`

---

### Step 2 — `validate.py`
Performs data quality checks on the raw parquet:
- Null counts per column
- Value range checks (claim amounts, dates)
- Duplicate claim ID detection
- Categorical cardinality summary

Writes a human-readable JSON report and a summary parquet (used by the API `/health` endpoint to surface data readiness).

**Input:** `data/processed/raw_claims.parquet`  
**Output:** `data/processed/validation_report.json`, `data/processed/validation_summary.parquet`

---

### Step 3 — `clean.py`
Applies normalisation and enrichment:
- Casts date columns to `Date` type
- Normalises string columns (strip whitespace, uppercase region/brand)
- Adds `HIGH_COST_FLAG` (claims above P95 of `CLAIM_AMOUNT_PAID`)
- Computes `CLAIM_TO_PREMIUM_RATIO` (imbalance proxy)
- Filters out records with missing mandatory fields

**Input:** `data/processed/raw_claims.parquet`  
**Output:** `data/processed/claims_cleaned.parquet`

> ⚠️ Polars 1.x note: all string literals inside `.then()` / `.otherwise()` must be wrapped in `pl.lit()`.

---

### Step 4 — `features.py`
Engineers numerical features used by the anomaly detection model:
- Peer-group statistics (mean, std, z-score) by warranty type, region, and brand
- Expected value residuals (actual paid vs group mean)
- Normalised ratio features
- Age and vehicle-age derived features

**Input:** `data/processed/claims_cleaned.parquet`  
**Output:** `data/processed/claims_featured.parquet`

> ⚠️ Polars 1.x note: use `pl.col(...).mean()` not `pl.mean(pl.col(...))`.

---

### Step 5 — `anomaly.py`
Scores each claim using a two-layer approach:

1. **Peer-group z-score** — how many standard deviations above the group mean is this claim's paid amount?
2. **IsolationForest** — unsupervised outlier score across the full engineered feature set

The final `ANOMALY_SCORE` (0–1) is a weighted combination. Claims above a threshold receive `ANOMALY_FLAG = True`. Human-readable `ANOMALY_REASONS` strings explain which signals triggered the flag.

**Input:** `data/processed/claims_featured.parquet`  
**Output:** `data/processed/claims_anomaly.parquet`

---

### Step 6 — `marts.py`
Aggregates the fully-scored claims into seven analytic mart parquets, then loads all of them into a single DuckDB file.

| Mart file | Content |
|-----------|---------|
| `kpi_mart.parquet` | Portfolio-level KPIs: total claims, total paid, avg paid, P95, anomaly rate, imbalance proxy |
| `warranty_mart.parquet` | Per-warranty aggregates: count, total paid, avg paid, anomaly rate, imbalance proxy |
| `geography_mart.parquet` | Per-region and per-province aggregates |
| `vehicle_mart.parquet` | Per-brand and per-model aggregates |
| `trend_mart.parquet` | Monthly time-series of claim count and total paid |
| `anomaly_mart.parquet` | Flat anomaly-flagged claim records with reason strings |
| `claim_detail_mart.parquet` | Full per-claim record with all fields for the detail modal |

**Input:** `data/processed/claims_anomaly.parquet`  
**Output:** `data/marts/*.parquet`, `data/duckdb/claimscope.duckdb`

---

### Optional — `train_severity_model.py`
Trains a LightGBM regression model to predict expected claim severity given warranty type, region, brand, and vehicle features. The model produces a `SEVERITY_BENCHMARK` column that can be used to flag claims that paid significantly above or below expectation.

This step is fully optional — the backend API functions without it.

---

## Common module

`common.py` contains:
- Column name constants (e.g. `COL_CLAIM_AMOUNT_PAID = "CLAIM_AMOUNT_PAID"`)
- Shared Polars type coercions
- Helper functions reused across pipeline steps

Editing column name constants here propagates changes to all steps automatically.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `File not found: data/raw/claim.xlsx` | Wrong path or filename | Rename to `claim.xlsx` (singular) |
| `Sheet 'Claim' not found` | Wrong Excel sheet name | Rename sheet to `Claim` |
| `InvalidOperationError` in features.py | Polars 1.x API change | Wrap string literals in `pl.lit()` |
| `AttributeError: pl.mean(...)` | Polars 1.x API change | Use `pl.col(...).mean()` instead |
| DuckDB file already open | Another process holds the file | Stop the backend before re-running the pipeline |
