# ClaimScope — Frontend

The React 18 dashboard for the ClaimScope platform. A dark-themed, data-dense analytics UI with 8 pages, a global filter panel, interactive charts, hover tooltips on every metric, and a Three.js network constellation intro page.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Routing | React Router v7 |
| Data fetching | TanStack React Query v5 |
| Charts | Recharts |
| Styling | Tailwind CSS v3 + custom design tokens |
| 3D intro | Three.js |
| Icons | Lucide React |
| Fonts | Inter Variable + Fira Code (monospace numbers) |

---

## Folder structure

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js          ← All design tokens (colors, shadows, radii, animations)
├── tsconfig.json
├── postcss.config.js
│
└── src/
    ├── main.tsx                ← React root, QueryClientProvider, RouterProvider
    ├── router.tsx              ← Route definitions
    ├── styles.css              ← Tailwind directives + global CSS classes
    ├── vite-env.d.ts
    │
    ├── pages/
    │   ├── IntroPage.tsx       ← Three.js landing page with network constellation
    │   ├── OverviewPage.tsx    ← KPI cards, warranty chart, regional chart, trend
    │   ├── WarrantiesPage.tsx  ← Warranty ranking table + drill-down detail
    │   ├── GeographyPage.tsx   ← Region/province leaderboard + detail
    │   ├── VehiclesPage.tsx    ← Brand/model concentration + brand detail
    │   ├── AnomaliesPage.tsx   ← Anomaly list, histogram, summary tables
    │   ├── ClaimsPage.tsx      ← Paginated claim table + detail modal
    │   ├── InsightsPage.tsx    ← Narrative insight panels + slide script
    │   └── [Page]Support.ts   ← Per-page type helpers and constants
    │
    ├── hooks/
    │   ├── useApiQuery.ts      ← TanStack Query wrapper with loading/error states
    │   └── useDashboardFilters.tsx ← Global filter context (provider + hook)
    │
    ├── lib/
    │   ├── api.ts              ← All fetch calls to the FastAPI backend
    │   ├── query.ts            ← Filter object → query string serialiser
    │   └── utils.ts            ← formatCurrency, formatNumber, formatPercent, compactDate
    │
    ├── types/
    │   ├── api.ts              ← TypeScript interfaces for all API response shapes
    │   └── filters.ts          ← DashboardFilters type
    │
    └── ui/
        ├── components/
        │   ├── KpiCard.tsx         ← KPI card with delta badge and tooltip
        │   ├── ChartCard.tsx       ← Chart wrapper with title, subtitle, ResponsiveContainer
        │   ├── DataTable.tsx       ← Sortable table with optional CSV export
        │   ├── MetricPills.tsx     ← Horizontal metric pill row with info tooltips
        │   ├── InsightList.tsx     ← Styled insight text list with tone variants
        │   ├── ClaimDetailModal.tsx ← Full claim detail overlay with anomaly breakdown
        │   ├── Tooltip.tsx         ← Portal-based hover tooltip (escapes stacking contexts)
        │   ├── SectionHeader.tsx   ← Section title + subtitle block
        │   ├── SkeletonCard.tsx    ← Loading skeleton placeholder
        │   └── ErrorBoundary.tsx   ← React error boundary wrapper
        │
        └── layout/
            ├── AppLayout.tsx       ← Main shell: sidebar + FilterDock + page content
            ├── Sidebar.tsx         ← Left navigation with route links and status panel
            ├── FilterDock.tsx      ← Collapsible global filter panel with multi-selects
            └── TopBar.tsx          ← Top header with page title and refresh button
```

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Intro | `/` | Three.js network constellation, author card with GitHub link, Enter Dashboard button |
| Overview | `/app` | 5 KPI cards, warranty bar chart (clickable), regional imbalance chart, trend line, insight lists |
| Warranties | `/app/warranties` | Full warranty ranking table, selected warranty drill-down with MetricPills and regional/brand breakdown |
| Geography | `/app/geography` | Region and province leaderboard tables, trend chart, detail view with dynamic summary metrics |
| Vehicles | `/app/vehicles` | Brand concentration table, model table, brand severity chart, model search, brand detail |
| Anomalies | `/app/anomalies` | Score distribution histogram, paginated anomaly table, concentration tables by warranty/region/brand |
| Claims | `/app/claims` | Sortable paginated claim table, CSV export, claim detail modal with anomaly component breakdown |
| Insights | `/app/insights` | 6 InsightList panels, suggested slide narrative steps, data disclaimer |

---

## Global filter panel

The `FilterDock` component provides portfolio-wide filtering that applies to every page:

| Filter | Type | Notes |
|--------|------|-------|
| Start date / End date | Date inputs | Claim date range |
| Warranty | Searchable multi-select | |
| Region | Searchable multi-select | |
| Province | Searchable multi-select | |
| Brand | Searchable multi-select | |
| Age bucket | Searchable multi-select | |
| Gender | Searchable multi-select | |
| Min anomaly score | Number input | 0.0–1.0 |
| Anomalies only | Checkbox | |
| High-cost only | Checkbox | P95+ severity claims |

**Behaviour:** auto-expands on the Overview tab, auto-collapses on all other tabs. The header row is the toggle button — the entire panel is one element. Active filters are shown as removable chips in the header.

`SearchableMultiSelect` is a fully custom component with `position: fixed` dropdowns (using `getBoundingClientRect()`) to escape `overflow: hidden` regions.

---

## Tooltip system

Every metric box, KPI card, and insight panel header has an `ⓘ` icon. Hovering shows a contextual description of the metric.

The `Tooltip` component uses `createPortal(_, document.body)` with `position: fixed` coordinates. This is required to escape:
- `backdrop-filter` stacking contexts (used by `.panel` cards)
- CSS `transform` containing blocks (used by KPI card hover animations)

Any tooltip rendered with `position: absolute` or `z-index` alone will be clipped or trapped behind cards.

---

## Data flow

```
useDashboardFilters()  ←→  React Context (global filter state)
        │
        ▼
useApiQuery([key, filters], fetcher)
        │  TanStack React Query — caches per [endpoint + filters]
        ▼
api.ts  →  fetch(API_BASE_URL + path + queryString)
        │
        ▼
FastAPI backend  →  DuckDB  →  JSON response
        │
        ▼
Page component renders charts / tables / pills
```

Switching pages does **not** re-fetch data unless filters change. TanStack Query's cache key is `[endpointName, filtersObject]`.

---

## Local development

```bash
cd frontend
npm install
npm run dev
```

Dashboard: `http://localhost:5173`

The backend must be running at `http://127.0.0.1:8000`. To use a different URL:

```bash
# .env (inside frontend/)
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Build for production

```bash
npm run build    # outputs to frontend/dist/
npm run preview  # local preview of the production build
```

---

## Design tokens

All visual constants are defined in `tailwind.config.js`. Do **not** use raw hex values in component files. Use token classes:

| Token class | Usage |
|-------------|-------|
| `panel` | Dark frosted card with backdrop-filter |
| `panel-muted` | Slightly lighter inset panel |
| `panel-glass` | Semi-transparent glass card (intro page) |
| `button` | Secondary action button |
| `button-primary` | Teal gradient CTA button |
| `badge`, `badge-accent`, `badge-danger` | Inline status labels |
| `section-title`, `section-subtitle` | Consistent heading styles |
| `input`, `select` | Dark-themed form controls |
| `chart-tooltip` | Recharts tooltip wrapper style |
| `animate-fade-in`, `animate-slide-up` | Entry animations with delay support |

---

## Three.js intro page

The intro background (`IntroPage.tsx`) renders:
- **65 nodes** — teal, violet, and white dots drifting with random velocities, bouncing off viewport edges
- **Dynamic edges** — `LineSegments` with a pre-allocated `MAX_SEGS` buffer; each frame rebuilds which pairs are within the 175px connection threshold via `setDrawRange`

The scene is fully cleaned up on component unmount (`cancelAnimationFrame` + `renderer.dispose()` + geometry disposal).
