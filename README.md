# WarrantyWise Backend

WarrantyWise is a backend-first MVP for vehicle-claims portfolio intelligence. It helps insurance analysts spot:
- warranties with disproportionate claim cost concentration
- geographic imbalance across regions and provinces
- brand/model segments concentrating severity
- statistically unusual claims within explainable peer groups

This project is intentionally **not** a fraud detection engine, **not** actuarial pricing, and **not** underwriting optimization. It is a decision-support analytics backend built on a **claims-only** dataset where premium is treated as an **imbalance proxy input**, not a true profitability denominator.

## Why this matters

Claims teams often have raw data but lack a fast, explainable analytics layer that can answer:
- Which warranty segments concentrate paid loss?
- Which regions consistently over-index on claim severity?
- Which brand/model combinations are structurally different from peers?
- Which claims are unusual relative to similar claims?

WarrantyWise packages that capability into:
- a reproducible ETL and feature pipeline
- DuckDB-backed analytics marts
- a clean FastAPI service layer
- deterministic anomaly screening with explainable reasons
- a scaffold for a severity benchmark model

## Architecture

Core flow:

1. `pipeline/ingest.py` loads the Excel sheet `Claim`
2. `pipeline/validate.py` creates data quality outputs
3. `pipeline/clean.py` standardizes and flags data issues
4. `pipeline/features.py` engineers explainable portfolio features
5. `pipeline/anomaly.py` computes anomaly signals
6. `pipeline/marts.py` builds marts and loads DuckDB
7. `backend/app/*` exposes portfolio intelligence APIs

Storage layers:
- raw Excel in `data/raw/`
- processed parquet outputs in `data/processed/`
- analytic marts in `data/marts/`
- DuckDB file in `data/duckdb/warrantywise.duckdb`

## Folder structure

```text
warrantywise/
  README.md
  pyproject.toml
  .env.example
  data/
    raw/
    processed/
    marts/
    duckdb/
  backend/
    app/
    tests/
  pipeline/
  notebooks/
  docs/
```

## Pipeline steps

### 1) Ingest
Loads `data/raw/claims.xlsx` sheet `Claim`, standardizes columns, coerces types, and writes:
- `data/processed/raw_claims.parquet`

### 2) Validate
Generates data quality checks for:
- row counts
- duplicate-like rows
- age validity
- date parsing failures
- null profile
- region/province consistency
- suspicious capped claims at exactly 10000
- category cardinality

Writes:
- `data/processed/validation_report.json`
- `data/processed/validation_summary.parquet`

### 3) Clean
Preserves raw signal while adding flags:
- `is_age_invalid`
- `is_geo_missing`
- `is_vehicle_info_missing`
- `is_duplicate_like`

Also normalizes category text and imputes region from province where mapping is consistent.

### 4) Feature engineering
Creates:
- time features
- age buckets
- imbalance proxy metrics
- segment priors
- peer-group expectations and z-scores

### 5) Anomaly scoring
Combines:
- robust z-score within peer groups
- Isolation Forest score
- residual anomaly versus peer expectation

Produces explainable reason strings and flags.

### 6) Marts + DuckDB
Builds:
- `kpi_mart.parquet`
- `warranty_mart.parquet`
- `geography_mart.parquet`
- `vehicle_mart.parquet`
- `anomaly_mart.parquet`
- `claim_detail_mart.parquet`
- `trend_mart.parquet`

And loads curated tables into:
- `data/duckdb/warrantywise.duckdb`

## API overview

### Health
- `GET /health`

### Filters
- `GET /filters`

### KPIs
- `GET /kpis`

### Warranties
- `GET /warranties/overview`
- `GET /warranties/trend`
- `GET /warranties/{warranty_name}`

### Geography
- `GET /geography/overview`
- `GET /geography/trend`
- `GET /geography/region/{region_name}`
- `GET /geography/province/{province_name}`

### Vehicles
- `GET /vehicles/overview`
- `GET /vehicles/brands/{brand_name}`
- `GET /vehicles/models/search?q=...`

### Claims
- `GET /claims`
- `GET /claims/{claim_id}`

### Anomalies
- `GET /anomalies`
- `GET /anomalies/summary`

### Insights
- `GET /insights/summary`

## Local setup

### Install dependencies

```bash
python -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -e ".[dev]"
```

Optional model extras:

```bash
pip install -e ".[dev,model]"
```

### Configure environment

```bash
cp .env.example .env
```

### Add raw data
Place the source file here:

```text
data/raw/claims.xlsx
```

Expected sheet name:
- `Claim`

## Run the pipeline

```bash
python -m pipeline.run_pipeline
```

## Start the API

```bash
uvicorn backend.app.main:app --reload
```

## Run tests

```bash
pytest
```

## Domain caveats

- This is a **claims-only** dataset.
- `PREMIUM_AMOUNT_PAID` is treated as an **imbalance proxy input**, not a true pricing or profitability denominator.
- No exposure denominator is available.
- No claim outcome lifecycle fields are available.
- Anomaly flags indicate statistical unusualness, not fraud truth.
- Severity benchmark outputs are scaffolds for comparison, not business truth or pricing decisions.

## Future improvements

- richer geography reference table
- calendarized trend seasonality analysis
- user authentication and saved views
- materialized DuckDB refresh orchestration
- front-end dashboard integration
- optional model registry and benchmark tracking
