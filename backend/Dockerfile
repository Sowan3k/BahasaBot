# BahasaBot — FastAPI Backend Docker Image
#
# Build context: backend/ directory (Render root directory = backend/)
#
# Container layout:
#   /app/backend/           ← WORKDIR; all source copied here
#   /app/backend/alembic.ini
#   /app/backend/db/migrations/
#   /app/backend/main.py, routers/, services/, ...
#
# PYTHONPATH=/app lets Python find 'from backend.X import Y' as /app/backend/X.py
# WORKDIR /app/backend means alembic resolves script_location = db/migrations
# relative to CWD, landing at /app/backend/db/migrations/ ✓
#
# Render: set Root Directory = backend/
# Railway: set Root Directory = backend/ in the Railway dashboard
#
# Local test (from backend/ directory):
#   docker build -t bahasabot-backend .
#   docker run -p 8000:8000 --env-file .env bahasabot-backend

FROM python:3.11-slim

# System deps — needed for psycopg2-binary and cryptography packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# WORKDIR = /app/backend so that:
#   - alembic upgrade head finds alembic.ini in CWD
#   - script_location = db/migrations resolves to /app/backend/db/migrations/
#   - uvicorn starts from the correct working directory
WORKDIR /app/backend

# ── Install Python dependencies (cached layer — only rebuilds when requirements change) ──
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy all backend source into WORKDIR ──────────────────────────────────────
# Build context is backend/, so '.' copies everything into /app/backend/
COPY . .

# ── PYTHONPATH ─────────────────────────────────────────────────────────────────
# /app is the parent of /app/backend, so Python resolves:
#   from backend.routers.auth import ...  →  /app/backend/routers/auth.py ✓
ENV PYTHONPATH=/app

# Expose default port (Render and Railway override via $PORT env var)
EXPOSE 8000

# ── Startup: run Alembic migrations then launch uvicorn ───────────────────────
# CWD = /app/backend, so:
#   alembic upgrade head  →  reads /app/backend/alembic.ini
#   script_location = db/migrations  →  /app/backend/db/migrations/ ✓
#   uvicorn backend.main:app  →  imports /app/backend/main.py via PYTHONPATH ✓
CMD sh -c "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"
