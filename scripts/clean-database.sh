#!/bin/bash

# Database Article Cleaner Script
# This script runs the article database cleaner using Docker

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory and go to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"
cd "$PROJECT_ROOT"

# Log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Show usage
show_usage() {
    echo "🧹 Database Article Cleaner"
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --dry-run           Show what would be deleted without actually deleting"
    echo "  --source SOURCE     Filter articles from specific source only"
    echo "  --limit NUMBER      Limit number of articles to process (for testing)"
    echo "  --batch-size SIZE   Batch size for processing (default: 10)"
    echo "  --concurrent NUM    Max concurrent API requests (default: 5)"
    echo "  --confirm           Skip confirmation prompt and proceed directly"
    echo "  --reset             Clear processing state and start over"
    echo "  --status            Show current processing status and exit"
    echo "  --help, -h          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --status                     # Check current processing status"
    echo "  $0 --dry-run                    # Safe preview of what would be cleaned"
    echo "  $0 --source \"Hacker News\"       # Clean only Hacker News articles"  
    echo "  $0 --limit 50 --dry-run        # Test on first 50 articles"
    echo "  $0 --concurrent 10 --confirm    # Run with higher concurrency"
    echo "  $0 --reset                      # Clear state and restart"
}

# Parse command line arguments
ARGS=()
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_usage
            exit 0
            ;;
        --dry-run|--source|--limit|--batch-size|--concurrent|--confirm|--reset|--status)
            ARGS+=("$1")
            if [[ $1 != "--dry-run" && $1 != "--confirm" && $1 != "--reset" && $1 != "--status" ]]; then
                shift
                ARGS+=("$1")
            fi
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
    shift
done

log "🧹 Starting database article cleaner..."

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

# Show warning for non-dry-run mode
if [[ ! " ${ARGS[@]} " =~ " --dry-run " ]]; then
    log "${YELLOW}⚠️  WARNING: This will potentially DELETE articles from the database!${NC}"
    if [[ ! " ${ARGS[@]} " =~ " --confirm " ]]; then
        log "${BLUE}💡 Tip: Use --dry-run to see what would be deleted first${NC}"
    fi
fi

# Build command with arguments
CMD="python clean_database.py"
for arg in "${ARGS[@]}"; do
    CMD="$CMD $arg"
done

log "${YELLOW}🔍 Running database cleaner: $CMD${NC}"

# Run the cleaner using docker-compose
# Use the tasks service from the tools profile
if docker-compose --profile tools run --rm --build tasks $CMD; then
    log "${GREEN}✅ Database cleaner completed successfully${NC}"
else
    exit_code=$?
    log "${RED}❌ Database cleaner failed with exit code $exit_code${NC}"
    exit $exit_code
fi

# Optional: Clean up any dangling containers
docker system prune -f > /dev/null 2>&1

log "${GREEN}🎉 Database cleaning job finished${NC}"