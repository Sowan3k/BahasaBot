# BahasaBot — FastAPI Backend Docker Image
#
# Build context: backend/ directory (Render root directory = backend/)
#
# Structure inside container:
#   /app/                   ← WORKDIR, PYTHONPATH root
#   /app/backend/           ← all Python source (from backend/)
#   /app/backend/alembic.ini
#   /app/backend/db/migrations/
#
# PYTHONPATH=/app makes 'from backend.X import Y' resolve correctly
# without requiring alembic.ini or the project root outside the build context.
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

WORKDIR /app

# ── Install Python dependencies (separate layer — cached unless requirements change) ──
# requirements.txt is at the root of the build context (backend/)
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy backend source into /app/backend/ ─────────────────────────────────────
# Copies the entire build context (backend/) into /app/backend/
# This preserves 'from backend.X import Y' import paths throughout the codebase.
COPY . ./backend/

# ── PYTHONPATH ─────────────────────────────────────────────────────────────────
# Adds /app to Python's module search path so 'from backend.X import Y' resolves
# to /app/backend/X.py. This is required because env.py's sys.path manipulation
# was written for the local repo layout and goes one level too many in a container.
ENV PYTHONPATH=/app

# Expose default port (Render and Railway override via $PORT env var)
EXPOSE 8000

# ── Startup: run Alembic migrations then launch uvicorn ───────────────────────
# alembic.ini lives at /app/backend/alembic.ini — pass it explicitly with -c
# script_location = db/migrations (relative to alembic.ini) = /app/backend/db/migrations
CMD sh -c "alembic -c backend/alembic.ini upgrade head && uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"
