FROM python:3.14-slim

WORKDIR /app

# System deps for Pillow/asyncpg wheels that occasionally need a compiler on slim.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# Alembic migration runs as a deploy step (ROADMAP.md Phase 8), not a
# separate manual command an operator has to remember.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
