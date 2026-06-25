# ClaimScope — Handoff Document

**Project:** ClaimScope — Vehicle Claims Portfolio Intelligence  
**GitHub:** https://github.com/Sajjad-Shahali/ClaimScope_hackathon  
**Author:** Sajjad Shahali  
**Affiliation:** MSc. Data Science, Politecnico di Torino  

---

## What was built

ClaimScope is a full-stack claims analytics platform with a Python data pipeline, FastAPI backend, and React dashboard. Given a raw Excel file of vehicle insurance claims, it produces:

- A seven-step reproducible ETL pipeline (ingest → validate → clean → features → anomaly → marts → DuckDB)
- A FastAPI service exposing 18 endpoints across warranties, geography, vehicles, claims, anomalies, and insights
- A React 18 dashboard with 8 pages, a collapsible global filter panel, interactive charts, and a Three.js intro page

---

## Repository layout

```
ClaimScope_hackathon/
├── data/               ← gitignored; must be created locally
│   ├── raw/claim.xlsx  ← source data (not committed)
│   ├── processed/      ← pipeline parquet outputs
│   ├── marts/          ← analytic mart parquets
│   └── duckdb/         ← claimscope.duckdb (serving store)
├── pipeline/           ← ETL steps, run via run_pipeline.py
├── backend/app/        ← FastAPI service
├── frontend/           ← React + Vite dashboard
├── docs/               ← architecture, methodology, data dictionary, this file
├── notebooks/          ← exploration notebooks
├── pyproject.toml      ← Python package + dependency spec
└── .env.example        ← environment variable template
```

---

## Environment setup

### Python

```bash
python -m venv .env
.env\Scripts\activate          # Windows
# source .env/bin/activate     # macOS / Linux

pip install -U pip
pip install -e ".[dev]"        # core + dev dependencies
pip install -e ".[dev,model]"  # optional: adds LightGBM
```

Key dependency versions (from `pyproject.toml`):
- Python 3.12
- FastAPI, Uvicorn
- Polars (pipeline ETL)
- Pandas (Excel ingestion only)
- DuckDB
- PyArrow / Parquet
- Scikit-learn (IsolationForest)
- Pydantic v2 / pydantic-settings
- Pytest

### Environment variables

```bash
cp .env.example .env
```

The only required override is `RAW_DATA_PATH` if the file is not at `data/raw/claim.xlsx`.

### Frontend

```bash
cd frontend
npm install   # regenerates package-lock.json fresh
npm run dev
```

Node.js 18+ required. The frontend was built with Vite 5 + React 18 + TypeScript.

---

## Running the system

### Step 1 — Run the data pipeline

```bash
python -m pipeline.run_pipeline
```

Expected output: 7 pipeline stages complete, no errors, DuckDB file created at `data/duckdb/`.

Common failure points:
- Wrong filename: file must be `data/raw/claim.xlsx` (not `claims.xlsx`)
- Wrong sheet name: Excel sheet must be named `Claim`
- Polars version mismatch: the pipeline requires Polars 1.x; bare strings in `.then()` / `.otherwise()` must be wrapped in `pl.lit()`

### Step 2 — Start the backend

```bash
uvicorn backend.app.main:app --reload
```

Health check: `curl http://127.0.0.1:8000/health`  
Interactive docs: `http://127.0.0.1:8000/docs`

### Step 3 — Start the frontend

```bash
cd frontend && npm run dev
```

Opens at `http://localhost:5173`. The intro page (`/`) shows the Three.js network constellation. Click **Enter Dashboard** to reach `/app`.

---

## Architecture decisions

### Why DuckDB?

DuckDB gives SQL-based OLAP over parquet files without a server. The entire analytics layer is a single `.duckdb` file that can be copied or regenerated from the pipeline in under a minute. No Postgres, no Spark, no infrastructure.

### Why Polars for the pipeline?

Polars' columnar, lazy evaluation handles the full claims dataset in memory efficiently and gives consistent types out of the box. Pandas is used only for Excel ingestion (openpyxl dependency), then immediately converted to Polars.

### Why deterministic insights?

Inserting an LLM into a hackathon analytics demo introduces unverifiable claims and fabricated causality. All insight text is template-rendered from computed metrics. Every sentence in the Insights page traces back to a specific DuckDB query result.

### Why IsolationForest over a supervised model?

No fraud labels exist. IsolationForest is unsupervised, requires no ground truth, and produces calibrated anomaly scores. It is combined with peer-group z-scores and expected-value residuals to produce human-readable reason strings.

### Frontend state management

Global filters live in a React context (`DashboardFilterProvider`). Every page reads from the same `useDashboardFilters()` hook. TanStack React Query caches per `[endpoint, filters]` key, so switching pages does not re-fetch unless filters change.

### Tooltip system

All metric boxes, KPI cards, and insight panel headers include an info icon (ⓘ) with a hover tooltip. The `Tooltip` component renders via `createPortal` into `document.body` with `position: fixed` coordinates from `getBoundingClientRect()`. This is the only approach that reliably escapes `backdrop-filter` stacking contexts and CSS `transform` containing blocks (both present in the panel/card components).

### Filter dock collapse behavior

The `FilterDock` component self-manages collapse state using `useLocation`. It auto-expands on `/app` (Overview) and auto-collapses on all other routes. The collapse toggle is the header row itself — the whole panel is one unified element, not a separate button + panel.

### Searchable multi-select dropdowns

`SearchableMultiSelect` is a fully custom component (no external combobox library). Dropdowns use `position: fixed` with coordinates from `triggerRef.getBoundingClientRect()` to escape the `overflow: hidden` regions and stacking contexts in the filter panel.

---

## What is working

- Full pipeline runs end-to-end from `claim.xlsx` to DuckDB
- All 18 API endpoints return data with consistent Pydantic schemas
- All 8 dashboard pages render with live backend data
- Global filter panel with searchable multi-select dropdowns (warranty, region, province, brand, age bucket, gender)
- Filter panel auto-collapses on non-Overview tabs, auto-expands on Overview
- Active filter chips shown inline in the filter panel header
- Clickable chart bars propagate filter changes (clicking a warranty bar filters all pages)
- Info icon (ⓘ) with hover tooltips on every metric box across all 8 pages:
  - Overview: all 5 KPI cards + 4 MiniMetric boxes
  - Warranties: all 4 MetricPills items
  - Geography: all dynamic summary MetricPills (key-to-tooltip lookup map)
  - Vehicles: Anomaly rate + dynamic summary MetricPills
  - Anomalies: all 4 MetricPills items
  - Claims: Sort by, Order, High-cost only, Search by Claim ID controls
  - Insights: all 6 InsightList panel headers
- Claim detail modal with anomaly component breakdown
- Anomaly histogram with score distribution
- Deterministic insight text generation
- Three.js network constellation intro page (65 drifting nodes with dynamic proximity-based edges)
- Author card with real profile photo and GitHub link inline
- CSV export on DataTable components

---

## Known limitations

- **No authentication.** The API is open with no auth layer. Do not deploy to a public endpoint with real claim data.
- **Single-user.** Filter state is browser-local; there is no persistent saved-view system.
- **Bundle size warning.** The frontend JS bundle is ~1.2 MB (Three.js + Recharts). Not a problem for a demo; would need code-splitting for production.
- **LightGBM is optional.** If not installed, the severity model step is skipped silently. The API still serves all data; severity benchmark features are absent.
- **No calendarized seasonality.** The trend endpoint shows claim volume over time but does not decompose seasonality.
- **DuckDB file path is fixed.** The path `data/duckdb/claimscope.duckdb` is set in config. Multi-environment setups need the `DUCKDB_PATH` env var.
- **Dynamic summary tooltip coverage.** Geography and Vehicles pages use a `SUMMARY_TOOLTIPS` key-to-string map. Backend keys not in the map show no tooltip — graceful fallback, but not exhaustive.

---

## Suggested next steps

1. **Add authentication** — OAuth2 / API key middleware on FastAPI before any external deployment
2. **Severity model registry** — persist LightGBM artefacts and expose a `/models/benchmark` endpoint
3. **Scheduled pipeline refresh** — Celery beat or a cron job to re-run the pipeline on new data drops
4. **Saved filter views** — persist named filter sets per user in a lightweight SQLite sidecar
5. **Geographic map layer** — replace the bar chart in Geography with a Leaflet choropleth map using province centroids
6. **Export to PDF/PPTX** — the Insights page narrative is slide-ready; a server-side renderer could produce a one-click export

---

## File-by-file notes

| File | Notes |
|------|-------|
| `pipeline/features.py` | All string literals inside `.then()` / `.otherwise()` must use `pl.lit()` — Polars 1.x breaking change |
| `pipeline/marts.py` | `.mean()` must be called as `pl.col(...).mean()`, not `pl.mean(pl.col(...))` |
| `pipeline/train_severity_model.py` | LightGBM import is wrapped in `try/except`; safe to run without it |
| `backend/app/core/config.py` | `RAW_DATA_PATH` defaults to `data/raw/claim.xlsx` (singular, not `claims`) |
| `frontend/src/ui/layout/FilterDock.tsx` | `SearchableMultiSelect` is fully custom — `position: fixed` dropdown via `getBoundingClientRect()` to escape `overflow: hidden` |
| `frontend/src/ui/components/Tooltip.tsx` | Uses `createPortal(_, document.body)` + `position: fixed` — the only way to reliably escape `backdrop-filter` and CSS `transform` stacking contexts |
| `frontend/src/pages/GeographyPage.tsx` | `SUMMARY_TOOLTIPS` map at top of file — add new backend summary keys here to get tooltip coverage |
| `frontend/src/pages/VehiclesPage.tsx` | Same `SUMMARY_TOOLTIPS` pattern as GeographyPage |
| `frontend/src/ui/components/InsightList.tsx` | Accepts optional `tooltip` prop — renders ⓘ icon in panel header when provided |
| `frontend/src/pages/IntroPage.tsx` | Three.js scene: 65 nodes + dynamic `LineSegments` with pre-allocated `MAX_SEGS` buffer, `setDrawRange` per frame |
| `frontend/tailwind.config.js` | All design tokens (colors, shadows, radii, animations) are defined here — do not use raw hex values in components |

---

## Contact

For questions about this project, reach out via GitHub Issues:  
https://github.com/Sajjad-Shahali/ClaimScope_hackathon/issues
