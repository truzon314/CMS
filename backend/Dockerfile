FROM python:3.14-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev curl postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN curl -o /usr/local/bin/cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connections/proxy/linux/amd64/cloud-sql-proxy \
    && chmod +x /usr/local/bin/cloud-sql-proxy

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

EXPOSE 8080

CMD ["sh", "-c", "cloud-sql-proxy truzonhomescom:asia-south1:truzon-postgres & sleep 5 && alembic upgrade heads || true && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]