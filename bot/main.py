import asyncio
import logging
import os
from typing import Optional

import httpx
from aiogram import Bot, Dispatcher, F
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import (
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
    WebAppInfo,
)
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://example.com")
API_BASE_URL = os.getenv("BOT_API_BASE_URL", "http://backend:8000/api")
ADMIN_IDS = {int(x) for x in os.getenv("ADMIN_TELEGRAM_IDS", "").split(",") if x}

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN is required")

logging.basicConfig(level=logging.INFO)

bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)
dp = Dispatcher()


def build_api_url(path: str) -> str:
    base = API_BASE_URL.rstrip("/")
    suffix = path if path.startswith("/") else f"/{path}"
    return f"{base}{suffix}"


async def fetch_user(telegram_id: int) -> Optional[dict]:
    url = build_api_url(f"/users/{telegram_id}")
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                return None
            logging.exception("Failed to fetch user from backend")
            return None
        except httpx.HTTPError:
            logging.exception("Failed to reach backend when fetching user")
            return None


async def save_user(telegram_id: int, name: str, phone: str, language: str) -> bool:
    payload = {
        "telegram_id": telegram_id,
        "name": name,
        "phone_number": phone,
        "language": language,
    }
    url = build_api_url("/users")
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return True
        except httpx.HTTPError:
            logging.exception("Failed to save user profile to backend")
            return False


def make_contact_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📱 Telefon raqamini jo'natish", request_contact=True)]],
        resize_keyboard=True,
    )


def make_webapp_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="🛍 Buyurtma berish", web_app=WebAppInfo(url=WEBAPP_URL))]],
        resize_keyboard=True,
    )


@dp.message(CommandStart())
async def command_start(message: Message):
    if not message.from_user:
        await message.answer(
            "Assalomu alaykum! Iltimos, Telegram ilovasidan foydalaning.",
            reply_markup=make_contact_keyboard(),
        )
        return

    existing = await fetch_user(message.from_user.id)
    if existing:
        await message.answer(
            "Assalomu alaykum! Do'konimizga hush kelibsiz. Mini ilovani ochib buyurtma berishingiz mumkin.",
            reply_markup=make_webapp_keyboard(),
        )
        return

    await message.answer(
        "Assalomu alaykum! Davom etish uchun iltimos, pastdagi tugma orqali telefon raqamingizni jo'nating.",
        reply_markup=make_contact_keyboard(),
    )


@dp.message(F.contact)
async def handle_contact(message: Message):
    if not message.contact or not message.from_user:
        await message.answer(
            "Telefon raqamini aniqlab bo'lmadi. Iltimos, qayta urinib ko'ring.",
            reply_markup=make_contact_keyboard(),
        )
        return

    if message.contact.user_id and message.contact.user_id != message.from_user.id:
        await message.answer(
            "Faqat o'zingizga tegishli telefon raqamini yuboring.",
            reply_markup=make_contact_keyboard(),
        )
        return

    telegram_id = message.from_user.id
    phone_number = message.contact.phone_number
    language = message.from_user.language_code or "uz"
    if language not in {"uz", "ru", "en"}:
        language = "uz"

    full_name_parts = [
        message.contact.first_name or message.from_user.first_name,
        message.contact.last_name or message.from_user.last_name,
    ]
    name = " ".join(part for part in full_name_parts if part).strip() or "Telegram foydalanuvchisi"

    saved = await save_user(telegram_id, name, phone_number, language)
    if not saved:
        await message.answer(
            "Ma'lumotlarni saqlashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
            reply_markup=make_contact_keyboard(),
        )
        return

    await message.answer(
        "Rahmat! Endi mini ilovani ochib buyurtma berishingiz mumkin.",
        reply_markup=make_webapp_keyboard(),
    )


@dp.message(F.text == "/admin")
async def admin_help(message: Message):
    if message.from_user and message.from_user.id in ADMIN_IDS:
        await message.answer(
            "Admin paneli uchun web ilovaga o'ting va maxsus endpointlardan foydalaning."
        )
    else:
        await message.answer("Sizda admin huquqlari yo'q.")


async def main() -> None:
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
