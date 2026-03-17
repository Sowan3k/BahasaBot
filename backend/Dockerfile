FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run database migrations then start the server
CMD alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
