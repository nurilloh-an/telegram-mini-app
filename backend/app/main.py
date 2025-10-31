import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import OperationalError

from .config import get_settings
from .database import prepare_database
from .routers import categories, orders, products, users

try:  # pragma: no cover - asyncpg optional at runtime
    from asyncpg import PostgresError
except ImportError:  # pragma: no cover - fallback if asyncpg missing
    PostgresError = None

settings = get_settings()

app = FastAPI(title=settings.app_name)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    retryable: tuple[type[Exception], ...] = (OperationalError, OSError)
    if PostgresError is not None:
        retryable = retryable + (PostgresError,)

    attempts = 0
    while True:
        try:
            await prepare_database()
            break
        except retryable as exc:  # type: ignore[arg-type]
            attempts += 1
            if attempts >= settings.db_startup_retries:
                logger.exception(
                    "Failed to initialize database after %s attempts", attempts
                )
                raise
            wait_time = settings.db_startup_retry_delay
            logger.warning(
                "Database unavailable (attempt %s/%s): %s. Retrying in %.1f seconds",
                attempts,
                settings.db_startup_retries,
                exc,
                wait_time,
            )
            await asyncio.sleep(wait_time)


async def health_check():
    return {"status": "ok"}


def _register_prefix(prefix: str) -> None:
    normalized_prefix = prefix or ""
    if normalized_prefix in seen_prefixes:
        return
    seen_prefixes.add(normalized_prefix)
    app.include_router(users.router, prefix=normalized_prefix)
    app.include_router(categories.router, prefix=normalized_prefix)
    app.include_router(products.router, prefix=normalized_prefix)
    app.include_router(orders.router, prefix=normalized_prefix)


prefixes = [settings.api_prefix, *settings.additional_api_prefixes]
public_roots = getattr(settings, "public_api_roots", [])

seen_prefixes: set[str] = set()

for prefix in prefixes:
    _register_prefix(prefix)

for public_root in public_roots:
    for prefix in prefixes:
        if not public_root:
            combined = prefix
        elif not prefix or prefix == "/":
            combined = public_root
        elif public_root == "/":
            combined = prefix
        else:
            combined = f"{public_root}{prefix}"
        _register_prefix(combined)

health_paths = ["/health"]
health_paths.extend(
    f"{public_root}/health" for public_root in public_roots if public_root and public_root != "/"
)

seen_health_paths: set[str] = set()

for path in health_paths:
    if path in seen_health_paths:
        continue
    seen_health_paths.add(path)
    app.add_api_route(path, health_check, methods=["GET"])

app.mount(settings.media_url, StaticFiles(directory=settings.media_root), name="uploads")
