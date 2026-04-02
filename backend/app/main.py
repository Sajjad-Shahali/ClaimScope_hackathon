from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes import (
    anomalies,
    claims,
    filters,
    geography,
    health,
    insights,
    kpis,
    vehicles,
    warranties,
)
from backend.app.core.config import get_settings
from backend.app.core.logging import configure_logging

configure_logging()
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "ClaimScope is a vehicle claims portfolio intelligence backend for explainable insurance analytics. "
        "Premium-based outputs are labelled as imbalance proxies, not true profitability."
    ),
    openapi_tags=[
        {"name": "health", "description": "Service health and data readiness."},
        {"name": "filters", "description": "Available filters and ranges for the UI."},
        {"name": "kpis", "description": "Global KPI cards and period comparisons."},
        {"name": "warranties", "description": "Warranty-level portfolio intelligence."},
        {"name": "geography", "description": "Region and province analytics."},
        {"name": "vehicles", "description": "Brand and model analytics."},
        {"name": "claims", "description": "Claim-level drilldown and pagination."},
        {"name": "anomalies", "description": "Anomaly screening and explainable rankings."},
        {"name": "insights", "description": "Template-driven portfolio summaries."},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(filters.router)
app.include_router(kpis.router)
app.include_router(warranties.router)
app.include_router(geography.router)
app.include_router(vehicles.router)
app.include_router(claims.router)
app.include_router(anomalies.router)
app.include_router(insights.router)
