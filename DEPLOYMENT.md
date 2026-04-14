# BahasaBot — Deployment Guide

> Frontend → **Vercel** | Backend → **Railway (Docker)** | Database → **Neon** | Cache → **Redis Cloud**

---

## Architecture

```
[Browser]
    │
    ├─── HTTPS ──► [Next.js — Vercel]
    │                    │
    │              NEXT_PUBLIC_API_URL
    │                    │
    └─────────────► [FastAPI — Railway Docker]
                         │
                ┌────────┼────────┐
           [Neon DB]  [Redis]  [Gemini API]
         (PostgreSQL   Cloud    (Google AI
          + pgvector)           Studio)
```

---

## Prerequisites

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| [Neon](https://neon.tech) | ✅ Yes | PostgreSQL + pgvector |
| [Redis Cloud](https://redis.io/cloud/) | ✅ Yes (30 MB) | Caching + session |
| [Railway](https://railway.app) | ✅ $5 credit | FastAPI Docker host |
| [Vercel](https://vercel.com) | ✅ Yes | Next.js host |
| [Google AI Studio](https://aistudio.google.com) | ✅ Yes | Gemini API key |
| [Google Cloud Console](https://console.cloud.google.com) | ✅ Yes | OAuth 2.0 client |
| [Resend](https://resend.com) | ✅ Yes (100/day) | Password reset emails |
| [Sentry](https://sentry.io) | ✅ Yes | Error monitoring (optional) |

---

## Step 1 — Database Setup (Neon)

1. Create a new project at neon.tech
2. Copy the **Connection String** — you need two versions:
   - **Runtime** (asyncpg): `postgresql+asyncpg://user:pass@ep-xxx.neon.tech/dbname?ssl=require`
   - **Migrations** (psycopg2): `postgresql+psycopg2://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`
3. **Important:** Remove `channel_binding=require` if present — asyncpg does not support it
4. Enable the pgvector extension — run this in the Neon SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### Run Alembic Migrations

From your local machine with `SYNC_DATABASE_URL` pointing to Neon:
```bash
# From project root (bahasabot/)
SYNC_DATABASE_URL="postgresql+psycopg2://..." alembic upgrade head
```

---

## Step 2 — Redis Setup (Redis Cloud)

1. Create a free database at redis.io/cloud
2. Copy the **Public endpoint** in format: `redis://default:password@host:port`
3. Use this as `REDIS_URL` in the backend

---

## Step 3 — Backend Deployment (Railway)

### 3a. Create Railway Project

1. Go to railway.app → New Project → Deploy from GitHub repo
2. Select the `bahasabot` repo
3. Railway will detect `backend/railway.toml` automatically

### 3b. Docker Build Configuration

The `backend/railway.toml` is already configured:
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "backend/Dockerfile"
# Build context = project root (required for import paths)
```

**Important:** The Docker build context is the **project root** (`bahasabot/`), not `backend/`.
This is because all Python imports use `from backend.X import Y` — the project root must be on `sys.path`.

The `.dockerignore` at the project root controls what is excluded from the build context.

### 3c. Set Railway Environment Variables

In Railway → your service → Variables, add **all** of the following:

| Variable | Value | Notes |
|----------|-------|-------|
| `APP_ENV` | `production` | Disables /docs, /redoc |
| `SECRET_KEY` | *(64-char random string)* | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | |
| `ALGORITHM` | `HS256` | |
| `DATABASE_URL` | `postgresql+asyncpg://...?ssl=require` | Neon asyncpg URL |
| `SYNC_DATABASE_URL` | `postgresql+psycopg2://...?sslmode=require` | Neon psycopg2 URL |
| `REDIS_URL` | `redis://default:pass@host:port` | Redis Cloud URL |
| `GOOGLE_CLIENT_ID` | `your-client-id.apps.googleusercontent.com` | Google OAuth |
| `GOOGLE_API_KEY` | `AIza...` | Google AI Studio key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | |
| `CHATBOT_GEMINI_MODEL` | `gemini-2.5-flash` | |
| `EMBEDDING_MODEL` | `models/gemini-embedding-001` | |
| `GEMINI_IMAGE_MODEL` | `gemini-3.1-flash-image-preview` | Do NOT change |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Your Vercel URL |
| `FRONTEND_URL` | `https://your-app.vercel.app` | For password reset emails |
| `ADMIN_EMAIL` | `your-email@example.com` | Gets admin role on first register |
| `RESEND_API_KEY` | `re_...` | From resend.com |
| `RESEND_FROM_EMAIL` | `BahasaBot <noreply@yourdomain.com>` | Verified sender |
| `SENTRY_DSN` | *(from sentry.io)* | Leave blank to disable |
| `RATE_LIMIT_PER_MINUTE` | `60` | |
| `CHATBOT_RATE_LIMIT_PER_MINUTE` | `20` | |

### 3d. Verify Deployment

Once Railway deploys, verify:
```
GET https://your-backend.up.railway.app/health
# Expected: {"status": "ok", "redis": "ok"}
```

---

## Step 4 — Seed the RAG Corpus

After the first successful Railway deployment, seed the Malay language corpus into pgvector.

**Option A — Run locally against production DB (recommended for first seed):**
```bash
# From project root
DATABASE_URL="postgresql+asyncpg://...?ssl=require" \
GOOGLE_API_KEY="AIza..." \
python backend/seed_production.py
```

**Option B — One-off Railway run:**
```bash
railway run python backend/seed_production.py
```

The script is **idempotent** — safe to run multiple times. It skips ingestion if documents already exist.

> **Note:** The app also auto-seeds on startup via `ingest_corpus_if_empty()` in `main.py`.
> The standalone script exists for cases where the startup seed fails or you want to seed before first launch.

---

## Step 5 — Frontend Deployment (Vercel)

### 5a. Connect Repository

1. Go to vercel.com → New Project → Import `bahasabot` repo
2. Set **Root Directory** to `frontend`
3. Framework: Next.js (auto-detected)

### 5b. Set Vercel Environment Variables

In Vercel → Project → Settings → Environment Variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your Vercel domain |
| `NEXTAUTH_SECRET` | *(32+ char random string)* | `openssl rand -base64 32` |
| `NEXT_PUBLIC_API_URL` | `https://your-backend.up.railway.app` | Railway backend URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `your-client-id.apps.googleusercontent.com` | Must match backend |
| `NEXT_PUBLIC_APP_NAME` | `BahasaBot` | |
| `NEXT_PUBLIC_SENTRY_DSN` | *(from sentry.io)* | Leave blank to disable |
| `SENTRY_AUTH_TOKEN` | *(from sentry.io)* | Build-time only; for source maps |

> The `frontend/vercel.json` maps these to Vercel secret references automatically.

### 5c. Google OAuth Redirect URIs

In Google Cloud Console → OAuth 2.0 Credentials → Authorized redirect URIs, add:
```
https://your-app.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google  (for local dev)
```

---

## Step 6 — Post-Deployment Checklist

- [ ] `GET /health` returns `{"status": "ok", "redis": "ok"}`
- [ ] RAG corpus seeded (`documents` table has rows in Neon)
- [ ] Admin account registered and role confirmed in DB
- [ ] Google OAuth sign-in works end-to-end
- [ ] Password reset email delivers via Resend
- [ ] Chatbot responds (Gemini API key valid)
- [ ] Course generation completes in background
- [ ] Journey roadmap generates with banner image
- [ ] Sentry error dashboard receiving events (if configured)

---

## Local Development

Copy env files and fill in your values:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Start both services:
```bash
# Windows
start-bahasabot.bat

# Or manually:
# Terminal 1 — backend (from project root)
cd bahasabot && uvicorn backend.main:app --reload --port 8000

# Terminal 2 — frontend
cd bahasabot/frontend && npm run dev
```

### Local Docker Build (test before deploying)

```bash
# From project root
docker build -f backend/Dockerfile -t bahasabot-backend .
docker run -p 8000:8000 --env-file backend/.env bahasabot-backend
```

---

## Environment Variables — Complete Reference

### Backend (`backend/.env` / Railway Variables)

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_ENV` | Yes | `development` or `production` |
| `SECRET_KEY` | Yes | JWT signing secret (64 chars) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | JWT access token TTL (default: 30) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Yes | JWT refresh token TTL (default: 7) |
| `ALGORITHM` | Yes | JWT algorithm (always `HS256`) |
| `DATABASE_URL` | Yes | asyncpg connection string |
| `SYNC_DATABASE_URL` | Yes | psycopg2 connection string (Alembic only) |
| `REDIS_URL` | Yes | Redis connection string |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_API_KEY` | Yes | Gemini API key |
| `GEMINI_MODEL` | Yes | Course/quiz generation model |
| `CHATBOT_GEMINI_MODEL` | Yes | Chatbot streaming model |
| `EMBEDDING_MODEL` | Yes | pgvector embedding model |
| `GEMINI_IMAGE_MODEL` | Yes | Image generation model |
| `ALLOWED_ORIGINS` | Yes | Comma-separated frontend URLs |
| `FRONTEND_URL` | Yes | Frontend URL for email links |
| `ADMIN_EMAIL` | No | Auto-admin email |
| `RESEND_API_KEY` | No* | Email service key (*required for password reset) |
| `RESEND_FROM_EMAIL` | No* | Sender address (*required for password reset) |
| `SENTRY_DSN` | No | Error monitoring DSN |
| `RATE_LIMIT_PER_MINUTE` | No | API rate limit (default: 60) |
| `CHATBOT_RATE_LIMIT_PER_MINUTE` | No | Chatbot rate limit (default: 20) |

### Frontend (`frontend/.env.local` / Vercel Variables)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_URL` | Yes | Full frontend URL |
| `NEXTAUTH_SECRET` | Yes | NextAuth session cookie secret |
| `NEXT_PUBLIC_API_URL` | Yes | FastAPI backend URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `NEXT_PUBLIC_APP_NAME` | No | App display name |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN (browser) |
| `SENTRY_AUTH_TOKEN` | No | Sentry source map upload token (build only) |

---

## Troubleshooting

### Backend won't start
- Check `GET /health` — if Redis shows `"unavailable"`, check `REDIS_URL`
- Check Railway logs for `GOOGLE_API_KEY is not set` warning
- Alembic migration errors: ensure `SYNC_DATABASE_URL` uses psycopg2, not asyncpg

### CORS errors in browser
- Ensure `ALLOWED_ORIGINS` in Railway matches the exact Vercel URL (no trailing slash)
- Add preview deployment URLs if needed: `https://bahasabot.vercel.app,https://bahasabot-*.vercel.app`

### Google OAuth not working
- Check Authorized redirect URIs in Google Cloud Console include the Vercel callback URL
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend) must exactly match `GOOGLE_CLIENT_ID` (backend)

### pgvector / RAG not working
- Verify `CREATE EXTENSION IF NOT EXISTS vector;` was run on Neon
- Run `python backend/seed_production.py` to seed the corpus
- Check document count in Neon: `SELECT COUNT(*) FROM documents;`

### Neon connection error: `channel_binding`
- Remove `channel_binding=require` from the connection string — asyncpg does not support it

### Images not generating
- Verify `GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview` (exact model name)
- Check `GOOGLE_API_KEY` has access to the Gemini image API
