from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .database import Base, engine
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


@app.get("/health")
async def health_check():
    return {"status": "ok"}


prefixes = [settings.api_prefix, *settings.additional_api_prefixes]

seen_prefixes: set[str] = set()
for prefix in prefixes:
    normalized_prefix = prefix or ""
    if normalized_prefix in seen_prefixes:
        continue
    seen_prefixes.add(normalized_prefix)
    app.include_router(users.router, prefix=normalized_prefix)
    app.include_router(categories.router, prefix=normalized_prefix)
    app.include_router(products.router, prefix=normalized_prefix)
    app.include_router(orders.router, prefix=normalized_prefix)

app.mount(settings.media_url, StaticFiles(directory=settings.media_root), name="uploads")
