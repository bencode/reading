# Use official Python runtime as base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create data directory for database
RUN mkdir -p /app/data

# Set environment variables
ENV PYTHONPATH=/app
ENV DATABASE_PATH=/app/data/reading.db

# Create a non-root user (使用与web服务相同的UID)
RUN useradd --create-home --shell /bin/bash --uid 1001 scraper
RUN chown -R scraper:scraper /app
USER scraper

# Default command (can be overridden)
CMD ["python", "scraper.py"]