import asyncio
import logging
import os

from aiogram import Bot, Dispatcher, F
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import Message, WebAppInfo
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://example.com")
ADMIN_IDS = {int(x) for x in os.getenv("ADMIN_TELEGRAM_IDS", "").split(",") if x}

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN is required")

logging.basicConfig(level=logging.INFO)

bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)
dp = Dispatcher()


@dp.message(CommandStart())
async def command_start(message: Message):
    keyboard = {
        "keyboard": [
            [
                {
                    "text": "🛍 Buyurtma berish",
                    "web_app": WebAppInfo(url=WEBAPP_URL),
                }
            ]
        ],
        "resize_keyboard": True,
    }
    await message.answer(
        "Assalomu alaykum! Bizning do'konga xush kelibsiz. Pastdagi tugma orqali mini ilovani oching.",
        reply_markup=keyboard,
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
