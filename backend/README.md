# ClaimScope — Backend

The FastAPI service that powers the ClaimScope dashboard. It reads from a DuckDB analytical database produced by the data pipeline and exposes 18 REST endpoints for portfolio KPIs, warranty analysis, geographic drill-downs, vehicle concentration, anomaly screening, and deterministic narrative insights.

---

## Architecture overview

```
HTTP request
    │
    ▼
FastAPI router (api/routes/)
    │  validates path/query params via Pydantic
    ▼
Service layer (services/)
    │  orchestrates business logic, applies filters
    ▼
Repository layer (repositories/)
    │  executes parameterised DuckDB SQL queries
    ▼
DuckDB (.duckdb file)
    │  reads from parquet-backed mart tables
    ▼
Pydantic response schema (schemas/)
    │  serialises result to JSON
    ▼
HTTP response
```

---

## Folder structure

```
backend/
├── __init__.py
├── app/
│   ├── main.py                  ← FastAPI app, CORS, router registration
│   │
│   ├── api/
│   │   ├── deps.py              ← shared FastAPI dependencies (DB session injection)
│   │   └── routes/
│   │       ├── health.py        ← GET /health
│   │       ├── filters.py       ← GET /filters
│   │       ├── kpis.py          ← GET /kpis
│   │       ├── warranties.py    ← GET /warranties/overview, /trend, /{name}
│   │       ├── geography.py     ← GET /geography/overview, /trend, /region/{}, /province/{}
│   │       ├── vehicles.py      ← GET /vehicles/overview, /brands/{}, /models/search
│   │       ├── claims.py        ← GET /claims, /claims/{claim_id}
│   │       ├── anomalies.py     ← GET /anomalies, /anomalies/summary
│   │       └── insights.py      ← GET /insights/summary
│   │
│   ├── services/
│   │   ├── kpi_service.py       ← KPI aggregation + period comparison logic
│   │   ├── warranty_service.py  ← Warranty ranking, trend, detail drill-down
│   │   ├── geography_service.py ← Region/province leaderboard and detail
│   │   ├── vehicle_service.py   ← Brand/model concentration, brand detail
│   │   ├── claim_service.py     ← Paginated claim list, single claim detail
│   │   ├── anomaly_service.py   ← Anomaly list, summary, reason buckets
│   │   ├── insight_service.py   ← Deterministic narrative text generation
│   │   └── filter_service.py    ← Available filter values from DuckDB
│   │
│   ├── repositories/
│   │   └── analytics_repository.py  ← All DuckDB SQL queries (single file)
│   │
│   ├── schemas/
│   │   ├── common.py            ← Shared types: RankingRow, TrendPoint, Pagination
│   │   ├── filters.py           ← FilterOptionsResponse
│   │   ├── health.py            ← HealthResponse
│   │   ├── kpis.py              ← KPIResponse with comparison deltas
│   │   ├── warranties.py        ← WarrantyOverviewResponse, WarrantyDetailResponse
│   │   ├── geography.py         ← GeographyOverviewResponse, GeographyDetailResponse
│   │   ├── vehicles.py          ← VehicleOverviewResponse, BrandDetailResponse
│   │   ├── claims.py            ← ClaimsListResponse, ClaimDetailResponse
│   │   ├── anomalies.py         ← AnomalyListResponse, AnomalySummaryResponse
│   │   └── insights.py          ← InsightSummaryResponse
│   │
│   ├── db/
│   │   └── duckdb.py            ← Lazy DuckDB connection with thread-safe singleton
│   │
│   ├── core/
│   │   ├── config.py            ← Pydantic settings (reads .env)
│   │   └── logging.py           ← Structured logging setup
│   │
│   └── utils/
│       ├── dates.py             ← Date parsing and period formatting helpers
│       ├── metrics.py           ← Metric calculation utilities
│       └── text.py              ← Insight text template helpers
│
└── tests/
    ├── conftest.py              ← Pytest fixtures (in-memory DuckDB with synthetic data)
    ├── test_health.py
    ├── test_kpis.py
    ├── test_filters.py
    ├── test_warranties.py
    ├── test_geography.py
    ├── test_anomalies.py
    └── test_claims.py
```

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service liveness + DuckDB connectivity check |
| GET | `/filters` | Available values for all filter dropdowns |
| GET | `/kpis` | Portfolio KPIs + comparison delta vs previous period |
| GET | `/warranties/overview` | Ranked warranty table (count, paid, imbalance proxy) |
| GET | `/warranties/trend` | Claim volume/value trend across time periods |
| GET | `/warranties/{name}` | Single warranty drill-down with top regions and brands |
| GET | `/geography/overview` | Region and province leaderboard |
| GET | `/geography/trend` | Geographic trend time series |
| GET | `/geography/region/{name}` | Region detail with breakdown and summary metrics |
| GET | `/geography/province/{name}` | Province detail with breakdown and summary metrics |
| GET | `/vehicles/overview` | Brand and model concentration tables |
| GET | `/vehicles/brands/{name}` | Brand detail with model mix, warranty mix, regional mix |
| GET | `/vehicles/models/search` | Full-text model name search |
| GET | `/claims` | Paginated, sortable claim list |
| GET | `/claims/{claim_id}` | Single claim with anomaly score components |
| GET | `/anomalies` | Paginated anomaly-ranked claims with reason strings |
| GET | `/anomalies/summary` | Anomaly count, rate, and concentration buckets |
| GET | `/insights/summary` | Deterministic narrative text for all insight categories |

### Universal filter query parameters

All endpoints (except `/health`, `/filters`) accept:

| Parameter | Type | Description |
|-----------|------|-------------|
| `warranty` | `string[]` | Filter by one or more warranty types |
| `region` | `string[]` | Filter by region |
| `province` | `string[]` | Filter by province |
| `brand` | `string[]` | Filter by vehicle brand |
| `age_bucket` | `string[]` | Filter by policyholder age group |
| `gender` | `string[]` | Filter by gender |
| `start_date` | `YYYY-MM-DD` | Earliest claim date |
| `end_date` | `YYYY-MM-DD` | Latest claim date |
| `anomaly_only` | `bool` | Restrict to flagged anomalies only |
| `high_cost_only` | `bool` | Restrict to P95+ severity claims |
| `min_anomaly_score` | `float 0–1` | Minimum anomaly score threshold |

---

## Configuration

All settings are loaded from environment variables (`.env` file at the project root).

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `WarrantyWise` | Application name shown in OpenAPI docs |
| `APP_ENV` | `local` | Environment label (`local`, `staging`, `prod`) |
| `APP_VERSION` | `0.1.0` | API version string |
| `DUCKDB_PATH` | `data/duckdb/warrantywise.duckdb` | Path to the DuckDB serving file |
| `RAW_DATA_PATH` | `data/raw/claim.xlsx` | Path to the source Excel file |
| `LOG_LEVEL` | `INFO` | Python logging level |
| `ENABLE_MODEL_ENDPOINTS` | `false` | Enable optional LightGBM severity endpoints |

```bash
cp .env.example .env
# edit .env as needed
```

---

## Running the server

```bash
# From the project root
uvicorn backend.app.main:app --reload
```

- API: `http://127.0.0.1:8000`
- Interactive docs (Swagger UI): `http://127.0.0.1:8000/docs`
- Alternative docs (ReDoc): `http://127.0.0.1:8000/redoc`

**The DuckDB file must exist before starting the server.** Run the data pipeline first if it does not:

```bash
python -m pipeline.run_pipeline
```

---

## Running tests

```bash
pytest
# or with coverage
pytest --cov=backend
```

Tests use an **in-memory DuckDB** populated with synthetic fixture data (defined in `tests/conftest.py`). No real claim data or pipeline run is required.

---

## Key design decisions

### Single repository file
All SQL queries live in `analytics_repository.py`. This makes it easy to audit every DuckDB query in one place and avoids scattering SQL across service files.

### Lazy DuckDB connection
`db/duckdb.py` opens the connection on first request and reuses it for the lifetime of the process. This avoids per-request overhead while staying simple (no connection pool needed for a single-file analytical database).

### Deterministic insights
`insight_service.py` renders narrative text from template strings populated with real computed values. There is no LLM involved — every sentence traces back to a DuckDB query result.

### Pydantic v2 schemas
All response models use Pydantic v2. Field aliases match the snake_case keys the frontend expects. `model_config = ConfigDict(from_attributes=True)` allows ORM-style construction from DuckDB result rows.
