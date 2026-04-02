from __future__ import annotations

from pathlib import Path

import duckdb

from backend.app.core.config import get_settings


class DuckDBManager:
    """Lazy DuckDB connection manager."""

    def __init__(self, path: Path | None = None) -> None:
        self.path = path or get_settings().duckdb_path
        self._conn: duckdb.DuckDBPyConnection | None = None

    def connect(self) -> duckdb.DuckDBPyConnection:
        """Create and cache a connection."""
        if self._conn is None:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self._conn = duckdb.connect(str(self.path))
        return self._conn

    def is_connected(self) -> bool:
        try:
            self.connect().execute("SELECT 1").fetchone()
            return True
        except Exception:
            return False

    def close(self) -> None:
        if self._conn is not None:
            self._conn.close()
            self._conn = None
