from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from .config import get_settings


settings = get_settings()


def ensure_admin(telegram_id: int | None) -> None:
    admin_ids = {int(x) for x in settings.admin_telegram_ids}
    if not telegram_id or telegram_id not in admin_ids:
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
