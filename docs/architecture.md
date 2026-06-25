# Architecture

## Goal
ClaimScope provides a backend-only analytics platform for claims portfolio intelligence on a claims-only vehicle warranty dataset.

## Layers

### Pipeline
`pipeline/` is responsible for reproducible ETL:
- ingest raw Excel
- validate data quality
- clean and flag issues
- engineer explainable features
- score anomalies
- build marts
- load DuckDB

### Storage
- raw Excel: `data/raw/claims.xlsx`
- processed parquet: `data/processed/`
- marts: `data/marts/`
- serving store: `data/duckdb/claimscope.duckdb`

### Backend
`backend/app/` contains:
- `api/routes`: thin HTTP route handlers
- `services`: orchestration and formatting
- `repositories`: DuckDB SQL access
- `schemas`: Pydantic response contracts
- `db`: lazy database connection
- `core`: config and structured logging

## Request flow
HTTP route -> service -> repository -> DuckDB -> service formatting -> Pydantic response

## Design principles
- claims-only caveats are explicit
- premium-derived metrics are labeled imbalance proxies
- anomaly logic is explainable and deterministic
- SQL is readable and centralized
- business logic stays out of route handlers
