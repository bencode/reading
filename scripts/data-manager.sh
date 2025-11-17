#!/bin/bash

# Reading App Data Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"
DATA_DIR="$PROJECT_ROOT/data"
DB_FILE="$DATA_DIR/reading.db"

show_help() {
    echo -e "${BLUE}Reading App Data Management${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  backup [file]    Create database backup (default: backup_YYYYMMDD_HHMMSS.db)"
    echo "  restore <file>   Restore database from backup file"
    echo "  export           Export database to SQL dump"
    echo "  info             Show database information"
    echo "  migrate          Run database migrations"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 backup                    # Create timestamped backup"
    echo "  $0 backup my_backup.db       # Create named backup"
    echo "  $0 restore backup_20240101_120000.db"
    echo "  $0 export > database_dump.sql"
}

ensure_data_dir() {
    if [ ! -d "$DATA_DIR" ]; then
        echo -e "${YELLOW}Creating data directory: $DATA_DIR${NC}"
        mkdir -p "$DATA_DIR"
    fi
}

backup_database() {
    local backup_file="${1:-backup_$(date +%Y%m%d_%H%M%S).db}"
    
    if [ ! -f "$DB_FILE" ]; then
        echo -e "${RED}❌ Database file not found: $DB_FILE${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}📦 Creating backup: $backup_file${NC}"
    cp "$DB_FILE" "$DATA_DIR/$backup_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup created successfully: $DATA_DIR/$backup_file${NC}"
        echo -e "${BLUE}📊 Backup size: $(du -h "$DATA_DIR/$backup_file" | cut -f1)${NC}"
    else
        echo -e "${RED}❌ Backup failed${NC}"
        exit 1
    fi
}

restore_database() {
    local restore_file="$1"
    
    if [ -z "$restore_file" ]; then
        echo -e "${RED}❌ Please specify backup file to restore${NC}"
        exit 1
    fi
    
    if [ ! -f "$restore_file" ] && [ ! -f "$DATA_DIR/$restore_file" ]; then
        echo -e "${RED}❌ Backup file not found: $restore_file${NC}"
        exit 1
    fi
    
    # Use full path if file exists in data directory
    if [ -f "$DATA_DIR/$restore_file" ]; then
        restore_file="$DATA_DIR/$restore_file"
    fi
    
    echo -e "${YELLOW}⚠️  This will replace the current database. Continue? (y/N)${NC}"
    read -r confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    
    # Backup current database first
    if [ -f "$DB_FILE" ]; then
        backup_database "backup_before_restore_$(date +%Y%m%d_%H%M%S).db"
    fi
    
    echo -e "${YELLOW}🔄 Restoring database from: $restore_file${NC}"
    cp "$restore_file" "$DB_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database restored successfully${NC}"
    else
        echo -e "${RED}❌ Restore failed${NC}"
        exit 1
    fi
}

export_database() {
    if [ ! -f "$DB_FILE" ]; then
        echo -e "${RED}❌ Database file not found: $DB_FILE${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}📤 Exporting database to SQL...${NC}" >&2
    sqlite3 "$DB_FILE" .dump
}

show_info() {
    if [ ! -f "$DB_FILE" ]; then
        echo -e "${RED}❌ Database file not found: $DB_FILE${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}📊 Database Information${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}File:${NC} $DB_FILE"
    echo -e "${YELLOW}Size:${NC} $(du -h "$DB_FILE" | cut -f1)"
    echo -e "${YELLOW}Modified:${NC} $(stat -c %y "$DB_FILE" 2>/dev/null || stat -f %Sm "$DB_FILE")"
    echo ""
    
    # Table information
    echo -e "${BLUE}📋 Tables:${NC}"
    sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table';" | while read table; do
        count=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM $table;")
        echo -e "  ${YELLOW}$table:${NC} $count records"
    done
    
    echo ""
    echo -e "${BLUE}📈 Available backups in $DATA_DIR:${NC}"
    ls -la "$DATA_DIR"/backup_*.db 2>/dev/null | while read line; do
        echo "  $line"
    done || echo "  No backups found"
}

migrate_database() {
    echo -e "${YELLOW}🔄 Running database migrations...${NC}"

    if command -v docker &> /dev/null && docker compose version &> /dev/null && [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        cd "$PROJECT_ROOT"
        docker compose run --rm db_init
    else
        echo -e "${YELLOW}Docker not available, running local migration...${NC}"
        cd "$PROJECT_ROOT/packages/tasks"
        yoyo apply --batch
    fi

    echo -e "${GREEN}✅ Migrations completed${NC}"
}

# Main script logic
case "${1:-help}" in
    backup)
        ensure_data_dir
        backup_database "$2"
        ;;
    restore)
        ensure_data_dir
        restore_database "$2"
        ;;
    export)
        export_database
        ;;
    info)
        show_info
        ;;
    migrate)
        ensure_data_dir
        migrate_database
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac