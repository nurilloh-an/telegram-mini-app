from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from .config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()
engine = create_async_engine(settings.database_url.replace("postgresql+psycopg2", "postgresql+asyncpg"))
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def _apply_schema_patches(conn: AsyncConnection) -> None:
    statements = (
        "ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_path VARCHAR(512)",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS image_path VARCHAR(512)",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS detail TEXT",
    )

    for statement in statements:
        await conn.exec_driver_sql(statement)


async def get_session():
    async with AsyncSessionLocal() as session:
        yield session


async def run_schema_patches(conn: AsyncConnection | None = None) -> None:
    if conn is not None:
        await _apply_schema_patches(conn)
        return
    async with engine.begin() as new_conn:
        await _apply_schema_patches(new_conn)


async def prepare_database() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _apply_schema_patches(conn)
