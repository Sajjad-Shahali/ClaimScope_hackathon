from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = Field(default="ClaimScope", alias="APP_NAME")
    app_env: str = Field(default="local", alias="APP_ENV")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    duckdb_path: Path = Field(default=Path("data/duckdb/claimscope.duckdb"), alias="DUCKDB_PATH")
    raw_data_path: Path = Field(default=Path("data/raw/claim.xlsx"), alias="RAW_DATA_PATH")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    enable_model_endpoints: bool = Field(default=False, alias="ENABLE_MODEL_ENDPOINTS")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
