# Dockerfile for deploying the backend to Hugging Face Spaces (Docker SDK)
# or any other Docker-based host (Fly.io, a VPS, etc).

FROM python:3.10-slim

WORKDIR /app

# Pillow/TensorFlow sometimes need this system library for image handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Hugging Face Spaces containers run as a non-root user — make sure our
# app can write its SQLite db, uploaded images, and model folder.
RUN mkdir -p /app/uploads /app/model && chmod -R 777 /app

# Hugging Face Spaces expects the app to listen on port 7860
EXPOSE 7860
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}
