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
        "ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey",
        "ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL",
        "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255)",
        "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image_path VARCHAR(512)",
        "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_detail TEXT",
    )

    for statement in statements:
        await conn.exec_driver_sql(statement)

    await conn.exec_driver_sql(
        """
        UPDATE order_items
        SET
            product_name = COALESCE(order_items.product_name, products.name),
            product_detail = COALESCE(order_items.product_detail, products.detail),
            product_image_path = COALESCE(order_items.product_image_path, products.image_path)
        FROM products
        WHERE order_items.product_id = products.id
        """
    )

    await conn.exec_driver_sql(
        "UPDATE order_items SET product_name = COALESCE(product_name, '')"
    )

    await conn.exec_driver_sql(
        "ALTER TABLE order_items ALTER COLUMN product_name SET NOT NULL"
    )


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
