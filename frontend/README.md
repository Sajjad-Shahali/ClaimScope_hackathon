# WarrantyWise Frontend

A polished React + TypeScript dashboard for the WarrantyWise backend.  
It is designed for hackathon storytelling and analyst-friendly portfolio exploration.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- React Router
- Recharts
- Lucide icons

## Features

- Executive overview with KPI cards and portfolio story
- Global filter bar wired to backend filter params
- Warranty, geography, vehicle, anomaly, claims, and insight pages
- Claim detail drill-down modal
- Clean dark premium UI for demos and judging
- Hackathon-ready notes and caveats embedded in the experience

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Backend expectation

The app expects the FastAPI backend to run on:

```bash
http://127.0.0.1:8000
```

Override it with:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Key pages

- `/` Overview
- `/warranties`
- `/geography`
- `/vehicles`
- `/anomalies`
- `/claims`
- `/insights`

## Notes

- Premium-based ratios are labelled as imbalance proxies.
- The UI intentionally includes caveat copy so the story stays compliant with the claims-only dataset constraints.
