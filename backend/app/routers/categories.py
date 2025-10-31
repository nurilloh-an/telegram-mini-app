from typing import List

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import Category
from ..schemas import CategoryRead
from ..utils import ensure_admin, save_upload_file

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=List[CategoryRead])
async def list_categories(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Category))
    categories = result.scalars().all()
    return categories


@router.post("", response_model=CategoryRead)
async def create_category(
    name: str = Form(...),
    image: UploadFile | None = File(default=None),
    x_telegram_user_id: int | None = Header(default=None, alias="X-Telegram-User-Id"),
    session: AsyncSession = Depends(get_session),
):
    ensure_admin(x_telegram_user_id)

    category = Category(name=name)
    if image:
        category.image_path = save_upload_file(image, "categories")

    session.add(category)
    await session.commit()
    await session.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: int,
    name: str = Form(...),
    image: UploadFile | None = File(default=None),
    x_telegram_user_id: int | None = Header(default=None, alias="X-Telegram-User-Id"),
    session: AsyncSession = Depends(get_session),
):
    ensure_admin(x_telegram_user_id)

    category = await session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    category.name = name
    if image:
        category.image_path = save_upload_file(image, "categories")

    await session.commit()
    await session.refresh(category)
    return category


@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    x_telegram_user_id: int | None = Header(default=None, alias="X-Telegram-User-Id"),
    session: AsyncSession = Depends(get_session),
):
    ensure_admin(x_telegram_user_id)

    category = await session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    await session.delete(category)
    await session.commit()
    return {"detail": "Category deleted"}
