from typing import List

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import AdminPhoneNumber, User
from ..schemas import (
    AdminPhoneNumberCreate,
    AdminPhoneNumberRead,
    UserCreate,
    UserRead,
)
from ..utils import ensure_admin, normalize_phone, sync_user_admin_status
from ..config import get_settings

router = APIRouter(prefix="/users", tags=["users"])
settings = get_settings()


@router.post("", response_model=UserRead)
async def create_or_update_user(payload: UserCreate, session: AsyncSession = Depends(get_session)):
    normalized_phone = normalize_phone(payload.phone_number)
    if not normalized_phone:
        raise HTTPException(status_code=400, detail="Telefon raqamini to'g'ri kiriting")

    result = await session.execute(select(User).where(User.telegram_id == payload.telegram_id))
    user = result.scalar_one_or_none()

    if user:
        user.name = payload.name
        user.phone_number = payload.phone_number
        user.phone_number_normalized = normalized_phone
        user.language = payload.language
    else:
        user = User(
            telegram_id=payload.telegram_id,
            name=payload.name,
            phone_number=payload.phone_number,
            phone_number_normalized=normalized_phone,
            language=payload.language,
        )
        session.add(user)

    await sync_user_admin_status(session, user)
    await session.commit()
    await session.refresh(user)
    return user


@router.get("/{telegram_id}", response_model=UserRead)
async def get_user(telegram_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await sync_user_admin_status(session, user)
    await session.commit()
    return user


@router.get("/admin-phone-numbers", response_model=List[AdminPhoneNumberRead])
async def list_admin_phone_numbers(
    x_telegram_user_id: int | None = Header(default=None, alias="X-Telegram-User-Id"),
    x_admin_phone_number: str | None = Header(default=None, alias="X-Admin-Phone-Number"),
    session: AsyncSession = Depends(get_session),
):
    await ensure_admin(session, x_telegram_user_id, x_admin_phone_number)

    entries: List[AdminPhoneNumberRead] = []
    seen: set[str] = set()

    for phone in settings.admin_phone_numbers:
        if phone in seen:
            continue
        entries.append(
            AdminPhoneNumberRead(id=None, phone_number=phone, source="config", created_at=None)
        )
        seen.add(phone)

    result = await session.execute(
        select(AdminPhoneNumber).order_by(AdminPhoneNumber.created_at.asc())
    )
    for record in result.scalars():
        if record.phone_number in seen:
            continue
        entries.append(
            AdminPhoneNumberRead(
                id=record.id,
                phone_number=record.phone_number,
                source="database",
                created_at=record.created_at,
            )
        )
        seen.add(record.phone_number)

    return entries


@router.post("/admin-phone-numbers", response_model=AdminPhoneNumberRead)
async def add_admin_phone_number(
    payload: AdminPhoneNumberCreate,
    x_telegram_user_id: int | None = Header(default=None, alias="X-Telegram-User-Id"),
    x_admin_phone_number: str | None = Header(default=None, alias="X-Admin-Phone-Number"),
    session: AsyncSession = Depends(get_session),
):
    await ensure_admin(session, x_telegram_user_id, x_admin_phone_number)

    normalized_phone = normalize_phone(payload.phone_number)
    if not normalized_phone:
        raise HTTPException(status_code=400, detail="Telefon raqamini to'g'ri kiriting")

    if normalized_phone in settings.admin_phone_numbers:
        raise HTTPException(status_code=400, detail="Bu raqam allaqachon konfiguratsiyada administrator")

    result = await session.execute(
        select(AdminPhoneNumber).where(AdminPhoneNumber.phone_number == normalized_phone)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Bu raqam administrator sifatida mavjud")

    entry = AdminPhoneNumber(phone_number=normalized_phone)
    session.add(entry)
    await session.flush()

    users_result = await session.execute(
        select(User).where(User.phone_number_normalized == normalized_phone)
    )
    for user in users_result.scalars():
        await sync_user_admin_status(session, user)

    await session.commit()
    await session.refresh(entry)

    return AdminPhoneNumberRead(
        id=entry.id,
        phone_number=entry.phone_number,
        source="database",
        created_at=entry.created_at,
    )


@router.delete("/admin-phone-numbers/{admin_phone_id}")
async def remove_admin_phone_number(
    admin_phone_id: int,
    x_telegram_user_id: int | None = Header(default=None, alias="X-Telegram-User-Id"),
    x_admin_phone_number: str | None = Header(default=None, alias="X-Admin-Phone-Number"),
    session: AsyncSession = Depends(get_session),
):
    await ensure_admin(session, x_telegram_user_id, x_admin_phone_number)

    entry = await session.get(AdminPhoneNumber, admin_phone_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Administrator topilmadi")

    normalized_phone = entry.phone_number
    await session.delete(entry)
    await session.flush()

    users_result = await session.execute(
        select(User).where(User.phone_number_normalized == normalized_phone)
    )
    for user in users_result.scalars():
        await sync_user_admin_status(session, user)

    await session.commit()

    return {"detail": "Administrator o'chirildi"}
