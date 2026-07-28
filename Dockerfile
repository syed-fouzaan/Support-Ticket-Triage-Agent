# Multi-stage production Dockerfile for SentinelDesk
FROM python:3.11-slim as base

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependency requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application backend & frontend source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY pytest.ini README.md ./

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8000

EXPOSE 8000 5173

# Run production Uvicorn server
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
