from datetime import datetime

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    duckdb_connected: bool
    data_last_loaded_at: datetime | None = None
