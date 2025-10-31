from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import Category, OrderItem, Product
from ..schemas import ProductRead
from ..utils import ensure_admin, save_upload_file

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[ProductRead])
async def list_products(category_id: int | None = None, session: AsyncSession = Depends(get_session)):
    stmt = select(Product)
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    result = await session.execute(stmt)
    products = result.scalars().all()
    return products


@router.post("", response_model=ProductRead)
async def create_product(
    category_id: int = Form(...),
    name: str = Form(...),
    price: float = Form(...),
    detail: str | None = Form(default=None),
    image: UploadFile | None = File(default=None),
    x_telegram_user_id: int | None = Header(default=None, alias="X-Telegram-User-Id"),
    x_admin_phone_number: str | None = Header(default=None, alias="X-Admin-Phone-Number"),
    session: AsyncSession = Depends(get_session),
):
    await ensure_admin(session, x_telegram_user_id, x_admin_phone_number)

    category = await session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    product = Product(category_id=category_id, name=name, price=Decimal(str(price)), detail=detail)
    if image:
        product.image_path = save_upload_file(image, "products")

    session.add(product)
    await session.commit()
    await session.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: int,
    category_id: int = Form(...),
    name: str = Form(...),
    price: float = Form(...),
    detail: str | None = Form(default=None),
    image: UploadFile | None = File(default=None),
    x_telegram_user_id: int | None = Header(default=None, alias="X-Telegram-User-Id"),
    x_admin_phone_number: str | None = Header(default=None, alias="X-Admin-Phone-Number"),
    session: AsyncSession = Depends(get_session),
):
    await ensure_admin(session, x_telegram_user_id, x_admin_phone_number)

    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.category_id = category_id
    product.name = name
    product.price = Decimal(str(price))
    product.detail = detail
    if image:
        product.image_path = save_upload_file(image, "products")

    await session.commit()
    await session.refresh(product)
    return product


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    x_telegram_user_id: int | None = Header(default=None, alias="X-Telegram-User-Id"),
    x_admin_phone_number: str | None = Header(default=None, alias="X-Admin-Phone-Number"),
    session: AsyncSession = Depends(get_session),
):
    await ensure_admin(session, x_telegram_user_id, x_admin_phone_number)

    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await session.execute(
        update(OrderItem).where(OrderItem.product_id == product_id).values(product_id=None)
    )
    await session.delete(product)
    await session.commit()
    return {"detail": "Product deleted"}
