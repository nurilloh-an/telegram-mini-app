from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _split_csv(value: str | List[str]) -> List[str]:
    if isinstance(value, list):
        return value
    return [item.strip() for item in value.split(",") if item.strip()]


def _normalize_prefix(value: str | None) -> str:
    if value is None:
        return ""
    normalized = value.strip()
    if not normalized:
        return ""
    if not normalized.startswith("/"):
        normalized = f"/{normalized}"
    if normalized != "/":
        normalized = normalized.rstrip("/")
    return normalized


class Settings(BaseSettings):
    app_name: str = "Telegram Market Mini App"
    api_prefix: str = "/api"
    additional_api_prefixes: List[str] = Field(default_factory=list)

    backend_cors_origins: List[str] | str = "*"
    admin_telegram_ids: List[int] | str | int = []

    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/telegram_mini_app"

    media_root: str = "app/static/uploads"
    media_url: str = "/static/uploads"

    bot_token: str | None = None
    webapp_url: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | List[str]) -> List[str]:
        items = _split_csv(value)
        return items or ["*"]

    @field_validator("api_prefix", mode="before")
    @classmethod
    def normalize_api_prefix(cls, value: str | None) -> str:
        return _normalize_prefix(value)

    @field_validator("additional_api_prefixes", mode="before")
    @classmethod
    def parse_additional_prefixes(cls, value: str | List[str] | None) -> List[str]:
        if value in (None, ""):
            return []
        prefixes = []
        for item in _split_csv(value):
            normalized = _normalize_prefix(item)
            if normalized:
                prefixes.append(normalized)
        return prefixes

    @field_validator("admin_telegram_ids", mode="before")
    @classmethod
    def parse_admin_ids(cls, value: str | List[int] | int | None) -> List[int]:
        if value is None or value == "":
            return []
        if isinstance(value, int):
            return [value]
        if isinstance(value, list):
            return [int(v) for v in value if f"{v}".strip()]
        return [int(item.strip()) for item in value.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
