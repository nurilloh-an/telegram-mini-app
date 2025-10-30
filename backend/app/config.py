from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _split_csv(value: str | List[str]) -> List[str]:
    if isinstance(value, list):
        return value
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings(BaseSettings):
    app_name: str = "Telegram Market Mini App"
    api_prefix: str = "/api"

    backend_cors_origins: List[str] = ["*"]
    admin_telegram_ids: List[int] = []

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

    @field_validator("admin_telegram_ids", mode="before")
    @classmethod
    def parse_admin_ids(cls, value: str | List[int]) -> List[int]:
        if isinstance(value, list):
            return [int(v) for v in value]
        if not value:
            return []
        return [int(item.strip()) for item in value.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
