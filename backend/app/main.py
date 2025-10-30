from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .database import Base, engine, run_schema_patches
from .routers import categories, orders, products, users

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await run_schema_patches()


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
