# BahasaBot — FastAPI Backend Docker Image
#
# Build context: PROJECT ROOT (bahasabot/), not backend/
# Reason: all Python imports use 'from backend.X import Y' which requires
# the project root on sys.path. alembic.ini also lives at the project root.
#
# Railway build:
#   railway.toml sets dockerfilePath = "backend/Dockerfile" and buildContext = "."
#
# Local build (from project root):
#   docker build -f backend/Dockerfile -t bahasabot-backend .
#   docker run -p 8000:8000 --env-file backend/.env bahasabot-backend

FROM python:3.11-slim

# System deps — needed for psycopg2-binary and cryptography packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install Python dependencies (separate layer — cached unless requirements change) ──
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy Alembic config (lives at project root) ────────────────────────────────
COPY alembic.ini ./alembic.ini

# ── Copy backend source into /app/backend/ ─────────────────────────────────────
# This preserves the 'from backend.X import Y' import paths used throughout.
COPY backend/ ./backend/

# Expose default port (Railway overrides via $PORT env var)
EXPOSE 8000

# ── Startup: run Alembic migrations then launch uvicorn ───────────────────────
# $PORT is set by Railway at runtime. Defaults to 8000 for local Docker runs.
CMD sh -c "alembic upgrade head && uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"
