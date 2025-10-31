from pathlib import Path
import re
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .models import AdminPhoneNumber, User


settings = get_settings()


def normalize_phone(value: str | None) -> str | None:
    if value is None:
        return None
    digits = re.sub(r"\D", "", value)
    return digits or None


async def _has_any_admin(session: AsyncSession) -> bool:
    if settings.admin_telegram_ids or settings.admin_phone_numbers:
        return True
    result = await session.execute(select(AdminPhoneNumber.id).limit(1))
    return result.scalar_one_or_none() is not None


async def is_admin_user(
    session: AsyncSession, telegram_id: int | None, phone_number: str | None = None
) -> bool:
    admin_ids = {int(x) for x in settings.admin_telegram_ids}
    admin_phones = {phone for phone in settings.admin_phone_numbers}

    normalized_phone = normalize_phone(phone_number)

    if admin_ids and telegram_id and telegram_id in admin_ids:
        return True

    if admin_phones and normalized_phone and normalized_phone in admin_phones:
        return True

    if normalized_phone:
        result = await session.execute(
            select(AdminPhoneNumber).where(AdminPhoneNumber.phone_number == normalized_phone)
        )
        if result.scalar_one_or_none() is not None:
            return True

    return False


async def ensure_admin(
    session: AsyncSession, telegram_id: int | None, phone_number: str | None = None
) -> None:
    if await is_admin_user(session, telegram_id, phone_number):
        return

    if not await _has_any_admin(session):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access not configured")

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


async def sync_user_admin_status(session: AsyncSession, user: User) -> None:
    is_admin = await is_admin_user(session, user.telegram_id, user.phone_number)
    user.is_admin = is_admin


def save_upload_file(upload_file: UploadFile, subdir: str) -> str:
    media_root = Path(settings.media_root)
    media_root.mkdir(parents=True, exist_ok=True)
    target_dir = media_root / subdir
    target_dir.mkdir(parents=True, exist_ok=True)

    original_name = upload_file.filename or "uploaded_file"
    extension = Path(original_name).suffix.lower()
    safe_name = f"{uuid4().hex}{extension}"
    path = target_dir / safe_name

    max_bytes = int(settings.max_upload_size_mb * 1024 * 1024)
    total_written = 0

    upload_file.file.seek(0)
    try:
        with path.open("wb") as buffer:
            while True:
                chunk = upload_file.file.read(1024 * 1024)
                if not chunk:
                    break
                total_written += len(chunk)
                if max_bytes and total_written > max_bytes:
                    buffer.close()
                    path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Fayl hajmi {settings.max_upload_size_mb:g} MB dan oshmasligi kerak",
                    )
                buffer.write(chunk)
    finally:
        try:
            upload_file.file.seek(0)
        except Exception:  # pragma: no cover - best effort reset
            pass

    relative_path = _build_media_path(subdir, safe_name)
    if settings.media_base_url:
        base = settings.media_base_url.rstrip("/")
        if relative_path.startswith("/"):
            return f"{base}{relative_path}"
        return f"{base}/{relative_path}"
    return relative_path


def _build_media_path(subdir: str, filename: str) -> str:
    base = (settings.media_url or "").strip()
    base = base.rstrip("/")
    normalized_subdir = subdir.strip("/")
    parts = [part for part in [base, normalized_subdir, filename] if part]
    path = "/".join(parts)
    if not path.startswith("/"):
        path = f"/{path}"
    return path
