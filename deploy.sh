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

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Build and start services
echo -e "${YELLOW}🔨 Building and starting services...${NC}"
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if web service is running
if docker-compose ps web | grep -q "Up"; then
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
    docker-compose logs web
    exit 1
fi

# Show running services
echo -e "${GREEN}📊 Running services:${NC}"
docker-compose ps

echo -e "${GREEN}✨ Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Useful commands:${NC}"
echo "  View logs:           docker-compose logs -f"
echo "  Stop services:       docker-compose down"
echo "  Restart services:    docker-compose restart"
echo "  Run scraper:         docker-compose --profile scraper up scraper"
echo "  Update application:  ./deploy.sh"