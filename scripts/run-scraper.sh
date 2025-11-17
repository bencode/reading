#!/bin/bash

# Article Scraper Cron Script
# This script runs the article scraper using Docker

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory and go to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"
cd "$PROJECT_ROOT"

# Log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "🕷️ Starting article scraper..."

# Check if project directory and docker-compose.yml exist
if [ ! -f "docker-compose.yml" ]; then
    log "${RED}❌ Error: docker-compose.yml not found in $PROJECT_ROOT${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    log "${RED}❌ Error: .env file not found. Please configure environment variables.${NC}"
    exit 1
fi

# Run the scraper using docker compose
log "${YELLOW}📡 Running article scraper...${NC}"

# Use docker compose run with the tasks service
# --rm: Remove container after execution
# --build: Rebuild image if source code changed
# The 'tools' profile ensures the tasks service is available
if docker compose --profile tools run --rm --build tasks python scraper.py; then
    log "${GREEN}✅ Article scraper completed successfully${NC}"
else
    log "${RED}❌ Article scraper failed with exit code $?${NC}"
    exit 1
fi

# Optional: Clean up any dangling containers
docker system prune -f > /dev/null 2>&1

log "${GREEN}🎉 Scraper job finished${NC}"