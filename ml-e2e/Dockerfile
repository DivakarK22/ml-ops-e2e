FROM python:3.11-slim AS base

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml README.md ./
COPY src ./src

RUN pip install --no-cache-dir -e .

RUN python -m ml_e2e.stages.stage02_sklearn

EXPOSE 8080
CMD ["uvicorn", "ml_e2e.service.app:app", "--host", "0.0.0.0", "--port", "8080"]