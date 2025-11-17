#!/bin/bash

# Reading App Deployment Script

set -e

echo "🚀 Starting Reading App Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo -e "${YELLOW}Please copy .env.example to .env and configure your settings:${NC}"
    echo "cp .env.example .env"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is available (V2 integrated version)
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not available. Please install Docker with Compose plugin.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Build images first to avoid downtime during deployment
echo -e "${YELLOW}🔨 Building images (this may take a while)...${NC}"
docker compose build

echo -e "${YELLOW}🔄 Performing zero-downtime deployment...${NC}"

# Check if services are currently running
if docker compose ps --services --filter "status=running" | grep -q .; then
    echo -e "${YELLOW}📦 Services are running, performing rolling update...${NC}"

    # Use up with --force-recreate to replace containers with new images
    # This recreates containers but tries to minimize downtime
    docker compose up -d --force-recreate --remove-orphans

    # Wait a moment for services to stabilize
    echo -e "${YELLOW}⏳ Waiting for services to stabilize...${NC}"
    sleep 5

    echo -e "${YELLOW}🧹 Cleaning up old images...${NC}"
    docker image prune -f
else
    echo -e "${YELLOW}🆕 First time deployment, starting services...${NC}"
    docker compose up -d
fi

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if web service is running
if docker compose ps web | grep -q "Up"; then
    echo -e "${GREEN}✅ Web service is running${NC}"
    echo -e "${GREEN}🌐 Application is available at: http://localhost:3000${NC}"

    # Extract ACCESS_TOKEN from .env for admin access
    if grep -q "ACCESS_TOKEN=" .env; then
        ACCESS_TOKEN=$(grep "ACCESS_TOKEN=" .env | cut -d '=' -f2)
        echo -e "${YELLOW}🔐 Admin login URL: http://localhost:3000/auth?token=${ACCESS_TOKEN}${NC}"
    fi
else
    echo -e "${RED}❌ Web service failed to start${NC}"
    echo "Checking logs..."
    docker compose logs web
    exit 1
fi

# Show running services
echo -e "${GREEN}📊 Running services:${NC}"
docker compose ps

echo -e "${GREEN}✨ Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Useful commands:${NC}"
echo "  View logs:           docker compose logs -f"
echo "  Stop services:       docker compose down"
echo "  Restart services:    docker compose restart"
echo "  Run scraper manually: ./run-scraper.sh"
echo "  Update application:  ./deploy.sh"
echo ""
echo -e "${YELLOW}🕷️ To set up automatic article scraping:${NC}"
echo "  sudo crontab -e"
echo "  Add: 0 */12 * * * cd $(pwd) && ./scripts/run-scraper.sh >> /var/log/reading-scraper.log 2>&1"