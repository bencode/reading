# Database Operations & Troubleshooting

This document contains useful database commands for troubleshooting and maintenance in the Reading application.

## Database Migration Commands

### Check Migration Status
```bash
# Local (using yoyo directly)
yoyo list -d sqlite:///data/reading.db packages/tasks/migrations/

# Server (using Docker)
docker-compose --profile tools run --rm tasks yoyo list -d sqlite:////app/data/reading.db migrations/
```

### Apply Migrations
```bash
# Local
yoyo apply -d sqlite:///data/reading.db packages/tasks/migrations/

# Server
docker-compose --profile tools run --rm tasks yoyo apply --batch -d sqlite:////app/data/reading.db migrations/

# Server with verbose output
docker-compose --profile tools run --rm tasks yoyo apply -v -d sqlite:////app/data/reading.db migrations/
```

### Rollback Migration
```bash
# Local - rollback to specific migration
yoyo rollback -d sqlite:///data/reading.db packages/tasks/migrations/ migration_id

# Server - rollback to specific migration
docker-compose --profile tools run --rm tasks yoyo rollback -d sqlite:////app/data/reading.db migrations/ migration_id
```

### Mark Migration as Applied (skip problematic migration)
```bash
# Server
docker-compose --profile tools run --rm tasks yoyo mark -d sqlite:////app/data/reading.db migrations/ migration_id
```

## Database Inspection Commands

### List All Tables
```bash
# Local
sqlite3 data/reading.db "SELECT name FROM sqlite_master WHERE type='table';"

# Server
docker-compose --profile tools run --rm tasks python -c "import sqlite3; conn = sqlite3.connect('/app/data/reading.db'); cursor = conn.cursor(); cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\";'); tables = cursor.fetchall(); print('Tables:', [t[0] for t in tables]); conn.close()"
```

### View Table Structure
```bash
# Local - view specific table structure
sqlite3 data/reading.db "PRAGMA table_info(table_name);"

# Server - view collections table structure
docker-compose --profile tools run --rm tasks python -c "import sqlite3; conn = sqlite3.connect('/app/data/reading.db'); cursor = conn.cursor(); cursor.execute('PRAGMA table_info(collections)'); columns = cursor.fetchall(); print('collections table:'); [print(f'  {col[1]} {col[2]}') for col in columns]; conn.close()"

# Server - view collection_sections table structure
docker-compose --profile tools run --rm tasks python -c "import sqlite3; conn = sqlite3.connect('/app/data/reading.db'); cursor = conn.cursor(); cursor.execute('PRAGMA table_info(collection_sections)'); columns = cursor.fetchall(); print('collection_sections table:'); [print(f'  {col[1]} {col[2]}') for col in columns]; conn.close()"
```

### Count Records in Tables
```bash
# Server - count collections
docker-compose --profile tools run --rm tasks python -c "import sqlite3; conn = sqlite3.connect('/app/data/reading.db'); cursor = conn.cursor(); cursor.execute('SELECT COUNT(*) FROM collections'); count = cursor.fetchone()[0]; print(f'collections table has {count} records'); conn.close()"

# Server - count collection_sections
docker-compose --profile tools run --rm tasks python -c "import sqlite3; conn = sqlite3.connect('/app/data/reading.db'); cursor = conn.cursor(); cursor.execute('SELECT COUNT(*) FROM collection_sections'); count = cursor.fetchone()[0]; print(f'collection_sections table has {count} records'); conn.close()"

# Server - count articles
docker-compose --profile tools run --rm tasks python -c "import sqlite3; conn = sqlite3.connect('/app/data/reading.db'); cursor = conn.cursor(); cursor.execute('SELECT COUNT(*) FROM articles'); count = cursor.fetchone()[0]; print(f'articles table has {count} records'); conn.close()"
```

### View Sample Data
```bash
# Server - view first 5 collections
docker-compose --profile tools run --rm tasks python -c "import sqlite3; conn = sqlite3.connect('/app/data/reading.db'); cursor = conn.cursor(); cursor.execute('SELECT id, title, status, created_at FROM collections LIMIT 5'); rows = cursor.fetchall(); print('Collections:'); [print(f'  {row[0]}: {row[1]} ({row[2]}) - {row[3]}') for row in rows]; conn.close()"
```

## Troubleshooting Commands

### Check if Specific Tables Exist
```bash
# Server - check if table exists
docker-compose --profile tools run --rm tasks python -c "import sqlite3; conn = sqlite3.connect('/app/data/reading.db'); cursor = conn.cursor(); cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\" AND name=\"table_name\"'); exists = cursor.fetchone() is not None; print(f'Table exists: {exists}'); conn.close()"
```

### Rebuild Docker Container (if migration files not recognized)
```bash
# Rebuild tasks container to load latest migration files
docker-compose --profile tools build tasks

# Then recheck migrations
docker-compose --profile tools run --rm tasks yoyo list -d sqlite:////app/data/reading.db migrations/
```

### Manual SQL Execution
```bash
# Server - execute custom SQL
docker-compose --profile tools run --rm tasks python -c "
import sqlite3
conn = sqlite3.connect('/app/data/reading.db')
cursor = conn.cursor()
# Your SQL here
cursor.execute('YOUR SQL STATEMENT')
# For SELECT queries
# result = cursor.fetchall()
# print(result)
# For INSERT/UPDATE/DELETE
# conn.commit()
conn.close()
"
```

## Common Issues and Solutions

### Migration Shows as U (Unapplied) but File Exists
1. Rebuild the Docker container: `docker-compose --profile tools build tasks`
2. Check file permissions and syntax
3. Verify migration dependencies

### Migration Fails with "table does not exist"
1. Check migration order and dependencies
2. Use `yoyo mark` to skip problematic migrations if needed
3. Create manual migration to handle edge cases

### Table Structure Mismatch
1. Use `PRAGMA table_info()` to compare expected vs actual structure
2. Create migration to alter table structure if needed
3. Consider data migration between different schemas

## File Locations

- **Local migrations**: `packages/tasks/migrations/`
- **Local database**: `data/reading.db`
- **Server database**: `/app/data/reading.db` (inside container)
- **Docker compose**: `docker-compose.yml` (tasks service with tools profile)