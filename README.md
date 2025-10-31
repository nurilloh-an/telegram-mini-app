# Telegram Market Mini App

Telegram mini-app platform for ordering grocery/market products through a Telegram bot. The stack includes a FastAPI backend, React-based mini app UI, PostgreSQL for persistence, and an Aiogram bot that launches the mini app. Everything is dockerized for deployment.

## Features

- **Mini app UI** for browsing categories/products, managing a cart, and submitting orders.
- **User profile capture** (name, phone number, language) without explicit registration; data is stored using the Telegram ID.
- **Admin endpoints** (protected via approved Telegram IDs or phone numbers) to manage categories, products, and order statuses.
- **Order processing API** for the Android courier/admin app to track and complete orders.
- **File uploads** for category/product images, stored locally (compatible with future S3 migration).
- **Telegram bot** that opens the mini app and provides simple admin guidance.
- **Docker Compose** setup with Postgres, backend, frontend, and bot services.

## Project structure

```
.
├── backend/        # FastAPI application and Dockerfile
├── bot/            # Aiogram bot script and Dockerfile
├── frontend/       # React mini app (Vite)
├── docker-compose.yml
├── .env.example
└── README.md
```

## Backend (FastAPI)

### Local development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`. OpenAPI docs: `http://localhost:8000/docs`.

### Key endpoints

- `POST /api/users` — create/update a user profile by Telegram ID.
- `GET /api/categories` — list categories.
- `POST /api/categories` — create category (**admin**, multipart form).
- `POST /api/products` — create product (**admin**, multipart form).
- `POST /api/orders` — create order (list of product IDs/quantities and optional comment).
- `GET /api/orders?status=pending` — admin list orders (pending/completed).
- `PATCH /api/orders/{id}` — update order status (**admin**).

Admin endpoints accept either the `X-Telegram-User-Id` header matching `ADMIN_TELEGRAM_IDS` or the `X-Admin-Phone-Number` header matching `ADMIN_PHONE_NUMBERS`.

### Database

- Uses PostgreSQL via SQLAlchemy ORM models.
- Tables are auto-created on startup.
- Order totals are calculated server-side.

### File uploads

- Images uploaded using multipart form data are stored under `backend/app/static/uploads`.
- Files are served at `/static/uploads/...` via FastAPI's static mount.
- Each upload is limited to **10 MB** by default; override with `MAX_UPLOAD_SIZE_MB` if you need a different limit.
- When the backend sits behind a reverse proxy that exposes media files under a custom public path or domain, set `MEDIA_BASE_URL`
  so the API responds with absolute URLs. Pair it with `VITE_MEDIA_BASE_URL` on the frontend if the mini app should request
  images from a CDN or proxied path.

## Frontend (React mini app)

### Local development

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`. Set `VITE_BACKEND_URL` in a `.env` file to point at the backend host and `VITE_BACKEND_API_PREFIX` (defaults to `/api`) to match the backend's `API_PREFIX`. If your reverse proxy keeps an additional public prefix (for example `/api-backend`) without stripping it, set `PUBLIC_API_ROOTS=/api-backend` so the backend automatically serves both `/api/...` and `/api-backend/api/...`. When uploads are exposed under a different public root or CDN, set `VITE_MEDIA_BASE_URL` (for example `https://your-domain.com/api-backend`) so the frontend builds absolute image URLs. For local testing outside Telegram, you can optionally set `VITE_FAKE_TELEGRAM_ID` to any numeric ID so the mini app can create a user profile. Pick any integer (for example your real Telegram user ID or `999999`) when you want the browser build to behave like a logged-in Telegram session, and leave it unset in production so genuine Telegram IDs flow through.

### Behavior

- On first load, prompts for name/phone/language and stores the profile when the shopper taps **Kirish**.
- Fetches categories/products, allows filtering and adding to a cart.
- Cart drawer shows item table with quantities and total price; submits orders via API.
- Designed to resemble the provided UI mockup with rounded cards, gradient background, and sticky cart.
- Admins (matched by `ADMIN_TELEGRAM_IDS`/`VITE_ADMIN_TELEGRAM_IDS` or `ADMIN_PHONE_NUMBERS`/`VITE_ADMIN_PHONE_NUMBERS`) get an additional "Boshqaruv" tab to create categories and products directly from the mini app.

## Telegram bot

### Local run

```bash
cd bot
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export BOT_TOKEN=... WEBAPP_URL=https://your-domain.tld ADMIN_TELEGRAM_IDS=123456
python main.py
```

The bot responds to `/start` with a button that opens the mini app.

## Docker Compose deployment

1. Copy `.env.example` to `.env` and fill in values (especially `BOT_TOKEN`, `WEBAPP_URL`, `ADMIN_TELEGRAM_IDS`/`ADMIN_PHONE_NUMBERS`, `VITE_ADMIN_TELEGRAM_IDS`/`VITE_ADMIN_PHONE_NUMBERS`). Keep `VITE_BACKEND_URL=http://backend:8000` and `VITE_BACKEND_API_PREFIX=/api` for Docker so the frontend builds against the internal API hostname/prefix, or change them to your public API base before deploying. If you expose the backend under a different public path (for example `/api-backend` behind Nginx) without rewriting it away, set `PUBLIC_API_ROOTS=/api-backend` so the backend automatically mirrors every API prefix behind that path.
2. Build and start services:

   ```bash
   docker compose up --build
   ```

3. Services:
   - `frontend` on port `5173` (exposed as HTTPS in production via reverse proxy).
   - `backend` on port `8000`.
   - `bot` running aiogram polling.
   - `db` running PostgreSQL 15.

Uploads are persisted via the `backend_uploads` volume, and database data via `db_data`.

## Android app integration

- Fetch pending orders: `GET /api/orders?status=pending` (include admin header).
- Mark order complete: `PATCH /api/orders/{id}` with `{"status": "completed"}` (include admin header).
- Orders include nested product data for display inside the Android app.

## Environment variables

Refer to `.env.example`. Key values:

- `DATABASE_URL` — SQLAlchemy URL (defaults to Postgres service in Docker).
- `DB_STARTUP_RETRIES` — number of attempts the backend makes to connect to the database during startup before failing (default `10`).
- `DB_STARTUP_RETRY_DELAY` — seconds to wait between database connection attempts on startup (default `2.0`).
- `ADMIN_TELEGRAM_IDS` — comma-separated list of Telegram IDs with admin privileges.
- `ADMIN_PHONE_NUMBERS` — comma-separated list of administrator phone numbers (digits only) that can authenticate via `X-Admin-Phone-Number`.
- `MEDIA_ROOT` — filesystem path where uploads are stored (default `app/static/uploads`).
- `MEDIA_URL` — relative URL prefix for serving uploads (default `/static/uploads`).
- `MEDIA_BASE_URL` — optional public base URL (e.g. `https://domain/api-backend`) to prepend when returning file URLs from the API.
- `MAX_UPLOAD_SIZE_MB` — maximum allowed upload size for images; defaults to `10`.
- `BOT_TOKEN` — Telegram bot token.
- `WEBAPP_URL` — public HTTPS URL serving the mini app (required for Telegram web apps).
- `VITE_BACKEND_URL` — frontend build-time variable pointing to the backend base URL (Docker Compose expects `http://backend:8000`).
- `API_PREFIX` / `VITE_BACKEND_API_PREFIX` — backend and frontend prefixes for API routes (default `/api`).
- `ADDITIONAL_API_PREFIXES` — optional comma-separated list of extra public prefixes (e.g. `/v1`) that should serve the same routes as `API_PREFIX`.
- `PUBLIC_API_ROOTS` — optional comma-separated list of base paths (e.g. `/api-backend`) to prepend to every API prefix when a reverse proxy doesn’t strip its public path.
- `VITE_ADMIN_TELEGRAM_IDS` — comma-separated list of admin IDs exposed to the frontend for enabling the management tab.
- `VITE_ADMIN_PHONE_NUMBERS` — comma-separated list of administrator phone numbers exposed to the frontend for enabling the management tab.
- `VITE_FAKE_TELEGRAM_ID` — optional numeric ID for local development without Telegram.
- `VITE_MEDIA_BASE_URL` — optional public base URL used by the frontend when generating image URLs (mirrors `MEDIA_BASE_URL`).
- `VITE_MAX_UPLOAD_SIZE_MB` — maximum upload size in MB used for client-side validation (defaults to `10`).

## Future enhancements

- Swap local file storage for S3-compatible object storage.
- Add authentication middleware to verify Telegram init data signatures.
- Introduce background workers/notifications for new orders.
