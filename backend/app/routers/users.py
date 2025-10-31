from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import User
from ..schemas import UserCreate, UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserRead)
async def create_or_update_user(payload: UserCreate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.telegram_id == payload.telegram_id))
    user = result.scalar_one_or_none()

    if user:
        user.name = payload.name
        user.phone_number = payload.phone_number
        user.language = payload.language
    else:
        user = User(
            telegram_id=payload.telegram_id,
            name=payload.name,
            phone_number=payload.phone_number,
            language=payload.language,
        )
        session.add(user)

    await session.commit()
    await session.refresh(user)
    return user


@router.get("/{telegram_id}", response_model=UserRead)
async def get_user(telegram_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
