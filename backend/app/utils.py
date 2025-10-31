from pathlib import Path
import re

from fastapi import HTTPException, UploadFile, status

from .config import get_settings


settings = get_settings()


def _normalize_phone(value: str | None) -> str | None:
    if value is None:
        return None
    digits = re.sub(r"\D", "", value)
    return digits or None


def ensure_admin(telegram_id: int | None, phone_number: str | None = None) -> None:
    admin_ids = {int(x) for x in settings.admin_telegram_ids}
    admin_phones = {phone for phone in settings.admin_phone_numbers}

    normalized_phone = _normalize_phone(phone_number)

    if admin_ids and telegram_id and telegram_id in admin_ids:
        return

    if admin_phones and normalized_phone and normalized_phone in admin_phones:
        return

    if not admin_ids and not admin_phones:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access not configured")

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


def save_upload_file(upload_file: UploadFile, subdir: str) -> str:
    media_root = Path(settings.media_root)
    media_root.mkdir(parents=True, exist_ok=True)
    target_dir = media_root / subdir
    target_dir.mkdir(parents=True, exist_ok=True)

    filename = upload_file.filename or "uploaded_file"
    safe_name = filename.replace("/", "_").replace("\\", "_")
    path = target_dir / safe_name

    with path.open("wb") as buffer:
        while True:
            chunk = upload_file.file.read(1024 * 1024)
            if not chunk:
                break
            buffer.write(chunk)

    return f"{settings.media_url}/{subdir}/{safe_name}"
