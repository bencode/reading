# Reading - Intelligent Article Aggregator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Reading** is an intelligent web application that automatically fetches articles from various online sources, uses AI to filter and summarize content, and presents them in a clean, organized interface. Perfect for staying informed without information overload.

## 🌟 Features

### 📰 **Smart Article Collection**
- **RSS Feed Integration**: Automatically fetches articles from configured RSS feeds
- **Web Scraping**: Extracts full article content from various news sources
- **Intelligent Classification**: AI-powered categorization and tagging

### 🤖 **AI-Powered Content Processing**
- **Article Summarization**: Generates concise summaries using LLM
- **Content Filtering**: Automatically filters relevant content based on your interests
- **Smart Categorization**: Organizes articles into meaningful categories

### 🛠️ **Technology Stack**

**Frontend:**
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful, accessible components
- **Knex.js** - SQL query builder

**Backend:**
- **Python 3.8+** - Data processing and AI integration
- **SQLite** - Lightweight, reliable database
- **RSS Parsing** - Article feed processing
- **LLM APIs** - AI-powered content processing

## 🚀 Quick Start

### Prerequisites

- **Node.js 22+** and **pnpm**
- **Python 3.8+** and **pip**
- **LLM API Access** (OpenAI, Anthropic, or compatible endpoint)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/reading.git
cd reading
```

### 2. Install Dependencies

```bash
# Install workspace dependencies
pnpm install

# Install Python dependencies
cd packages/tasks
pip install -r requirements.txt
```

### 3. Environment Setup

**Python Backend Configuration:**
```bash
# packages/tasks/.env
LLM_API_ENDPOINT=https://api.openai.com/v1/chat/completions
DASHSCOPE_API_KEY=your_api_key_here

# Database Access Mode (Optional)
# WEB_API_URL=http://localhost:3000  # Use API mode for container deployment
# DATABASE_PATH=/custom/path/reading.db  # Custom database path
```

**Database Access Modes:**

The application supports two database access modes:

1. **Direct Database Mode (Default)**
   - Scraper directly accesses SQLite database file
   - Suitable for local development and single-instance deployment
   - Best performance for local file system access

2. **API Proxy Mode (Container-Friendly)**
   - Scraper uses HTTP API calls to web application for database operations
   - Solves SQLite concurrency issues in containerized environments
   - Required when web and scraper run in separate containers
   - Configure by setting `WEB_API_URL` environment variable

```bash
# For container deployment (scraper → web API → database)
WEB_API_URL=http://web-service:3000

# For local development (scraper → direct database access)
# Leave WEB_API_URL unset or empty
```

**Web Frontend Authentication:**
```bash
# packages/web/.env.local
cd packages/web
cp .env.example .env.local
```

Edit `.env.local` with your authentication settings:
```bash
# Generate secure tokens
ACCESS_TOKEN=$(openssl rand -hex 16)    # 32 characters
JWT_SECRET=$(openssl rand -base64 32)   # 44 characters

# Generate password hash
node generate-hash.js your-admin-password
```

Complete `.env.local` example:
```env
ACCESS_TOKEN=22d3ccb8be04566879114f0874b2b9e5
JWT_SECRET=t9qBY2+kjIzXFEcN/gpmV0WlvmO8WGKCpkKbtRmzmJ2E0iSN
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$XoSv6ehod3rwSHf0MOnblu14hq2LLSyfSuZaI2Me7UCKSUaHnJD/K
DATABASE_PATH=../../data/reading.db
NODE_ENV=development
```

### 4. Database Setup

```bash
# Initialize database and run migrations
cd packages/tasks
yoyo apply
```

### 5. Start the Application

```bash
# Terminal 1: Start the web frontend
cd packages/web
pnpm dev

# Terminal 2: Run article scraping (optional, for new content)
cd packages/tasks
python scraper.py

```

Visit `http://localhost:3000` to access the application!

## 🔐 Authentication System

The application supports two access modes for secure deployment:

### **Public Access (Read-Only)**
- Browse and view all articles
- Use category and status filters
- No editing capabilities

### **Authenticated Access (Full Control)**
1. **Access Login Page**: `http://localhost:3000/auth?token=YOUR_ACCESS_TOKEN`
2. **Enter Admin Password**: Use the password you configured
3. **Full Features**: Star articles, mark as read, rate, delete/restore

### **Deployment Security**
- **ACCESS_TOKEN**: Controls who can access the login page
- **JWT_SECRET**: Secures user sessions
- **Password Hash**: Protects admin authentication
- All editing operations require authentication

## 🐳 Docker Deployment

### **Quick Start with Docker**

1. **Clone and Configure**:
   ```bash
   git clone https://github.com/yourusername/reading.git
   cd reading
   
   # Configure environment
   cp .env.example .env
   # Edit .env with your settings (see Environment Setup section above)
   ```

2. **Deploy with One Command**:
   ```bash
   ./scripts/deploy.sh
   ```

3. **Access Your Application**:
   - **Public Access**: `http://localhost:3000`
   - **Admin Access**: `http://localhost:3000/auth?token=YOUR_ACCESS_TOKEN`

### **Manual Docker Commands**

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Run article scraper manually
./scripts/run-scraper.sh

# Stop services
docker-compose down

# Update and restart
docker-compose down && docker-compose build --no-cache && docker-compose up -d
```

### **Docker Architecture**

- **Web Service**: Next.js frontend (Port 3000)
- **DB Init**: Database initialization with migrations (runs once)
- **Volume**: Persistent SQLite database storage
- **Network**: Isolated container communication
- **Scraper**: External cron-scheduled article collection

**Container Database Access:**
- Web and scraper containers use **API Proxy Mode** automatically
- No SQLite file locking issues between containers
- Configure `WEB_API_URL=http://web-service:3000` in container environment

### **Production Deployment**

1. **Server Setup**: Install Docker and Docker Compose
2. **Environment**: Configure `.env` with production values
3. **SSL/Reverse Proxy**: Use nginx or Caddy for HTTPS
4. **Cron Jobs**: Schedule article scraping with system cron
5. **Monitoring**: Set up log aggregation and health checks

### **Scheduled Article Scraping**

Set up automatic article collection with cron:

```bash
# Open crontab editor
sudo crontab -e

# Add scraper schedule (every 6 hours)
0 */6 * * * cd /path/to/reading && ./scripts/run-scraper.sh >> /var/log/reading-scraper.log 2>&1

# Or run daily at 6 AM and 6 PM
0 6,18 * * * cd /path/to/reading && ./scripts/run-scraper.sh >> /var/log/reading-scraper.log 2>&1
```

**Manual scraper execution:**
```bash
# Run scraper immediately
./scripts/run-scraper.sh

# Check scraper logs
tail -f /var/log/reading-scraper.log
```

## 💾 Data Management

The application uses SQLite database with bind mount for easy data access and backup.

### **Database Location**
- **Host**: `./data/reading.db`
- **Container**: `/app/data/reading.db`
- **Direct Access**: Your database is always accessible in the local `data/` directory

### **Data Management Commands**

```bash
# Database backup
./scripts/data-manager.sh backup                    # Create timestamped backup
./scripts/data-manager.sh backup my_backup.db       # Create named backup

# Database restore
./scripts/data-manager.sh restore backup_20240101_120000.db

# Database export (SQL dump)
./scripts/data-manager.sh export > database_dump.sql

# Database information
./scripts/data-manager.sh info

# Run migrations
./scripts/data-manager.sh migrate
```

### **Migration from Existing Data**

If you have existing `data/reading.db`:
1. **Keep your current data** - No migration needed with bind mount
2. **Backup first**: `./scripts/data-manager.sh backup`
3. **Deploy**: `./scripts/deploy.sh`
4. **Your data persists** - Container uses your existing database

### **Backup Strategy**

```bash
# Daily backup (add to crontab)
0 2 * * * cd /path/to/reading && ./scripts/data-manager.sh backup >> /var/log/reading-backup.log 2>&1

# Manual backup before updates
./scripts/data-manager.sh backup before_update_$(date +%Y%m%d)

# Export for migration
./scripts/data-manager.sh export > reading_export_$(date +%Y%m%d).sql
```

## 🛠️ Development

### Project Structure

**Monorepo Architecture:**
```
packages/
├── web/                # Next.js frontend with TypeScript
│   └── src/           # App Router, API routes, components
└── tasks/             # Python backend (modular design)
    ├── scraper.py          # Main orchestration and RSS processing
    ├── db_operations.py    # Database operations and connection handling  
    ├── llm_processing.py   # LLM integration and content analysis
    ├── article_processing.py # Article content extraction and processing
    └── migrations/         # Database schema management
```

**Key Features:**
- **Modular Backend**: Each module has single responsibility with dependency injection
- **Dual Database Modes**: Direct access or API proxy for container deployments
- **Graceful Degradation**: Intelligent fallbacks when LLM services unavailable
- **Code Quality**: Comprehensive linting with flake8, black, and isort

### Commands

```bash
# Frontend development
cd packages/web
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm lint             # Run ESLint
pnpm typecheck        # TypeScript checking

# Backend development  
cd packages/tasks
python scraper.py     # Run article scraper with LLM processing
yoyo apply           # Apply database migrations
make lint            # Run code quality checks (flake8, black, isort)
make format          # Auto-format code with black and isort
```
## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Happy Reading!** 📚✨

For questions, issues, or feature requests, please [open an issue](https://github.com/yourusername/reading/issues).
