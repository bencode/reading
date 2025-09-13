# Reading - AI-Powered Reading System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Reading** is an intelligent reading system that collects, curates, and organizes tech articles into weekly reading collections. Features AI-powered content processing, rich markdown editing, and a clean web interface for focused reading experiences.  
🌐 **Demo**: [reading.qijun.io](https://reading.qijun.io/) · 📋 [RSS Sources](packages/tasks/rss_config.yaml)

---

## 🌟 Features

### 📰 Smart Article Collection
- RSS integration & web scraping from multiple sources
- AI-powered content classification & tagging
- Article notes and skip functionality for better organization

### 📖 Weekly Reading Collections
- Create curated article collections with custom titles and descriptions
- Rich markdown editor with AI assistant for content creation
- Draft/publish workflow with cover images
- Public reading interface for published collections

### 🤖 AI Processing
- Automatic article summarization
- Content filtering by interest and relevance
- Smart categorization and quality assessment
- AI-powered image generation for collection covers

### 🛠️ Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Python 3.8+, SQLite, RSS parser, LLM APIs
- **Database**: SQLite with migration system using yoyo-migrations  

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.8+
- SQLite

### Installation
```bash
git clone https://github.com/yourusername/reading.git
cd reading
pnpm install
cd packages/tasks && pip install -r requirements.txt
```

### Configuration
1. Copy environment file: `cp .env.example .env`
2. Configure API keys and database settings in `.env`
3. Initialize database: `yoyo apply -d sqlite:///data/reading.db packages/tasks/migrations/`

### Development
Start both services:
```bash
# Terminal 1 - Web frontend
cd packages/web && pnpm dev

# Terminal 2 - Article scraping (optional)
cd packages/tasks && python scraper.py
```

Visit `http://localhost:3000` to access the application.
Admin interface: `http://localhost:3000/admin`  

---

## 🔐 Authentication & Security

### Admin Access Setup
The application uses password-based authentication for admin features:

1. Generate password hash:
   ```bash
   cd packages/web
   node generate-hash.js your-admin-password
   ```

2. Add to `.env.local`:
   ```env
   ADMIN_PASSWORD_HASH_ENCODED=<generated-hash>
   ```

3. Access admin via: `http://localhost:3000/auth?token=your-access-token`

### Access Levels
- **Public**: Browse published collections and articles (read-only)
- **Authenticated**: Full CRUD access to collections, articles, and admin features  

---

## 🐳 Docker Deployment
```bash
./scripts/deploy.sh
```
- Web: Next.js frontend  
- Scraper: scheduled article collection  
- SQLite with volume persistence  

---

## 💾 Database & Data Management

### Database Migrations
```bash
# Apply all pending migrations
yoyo apply -d sqlite:///data/reading.db packages/tasks/migrations/

# List migration status
yoyo list -d sqlite:///data/reading.db packages/tasks/migrations/
```

### Data Management Scripts
```bash
./scripts/data-manager.sh backup   # Backup database
./scripts/data-manager.sh restore  # Restore from backup
./scripts/data-manager.sh export   # Export SQL dump
```

### Article Quality Management
```bash
# Run migrations first for new installations
yoyo apply -d sqlite:///data/reading.db packages/tasks/migrations/

# Preview articles to be removed
./scripts/clean-database.sh --dry-run

# Clean specific source
./scripts/clean-database.sh --source "Hacker News"

# Test on limited articles
./scripts/clean-database.sh --limit 50 --dry-run

# Check processing status
./scripts/clean-database.sh --status

# Execute cleanup (after preview)
./scripts/clean-database.sh --confirm
```

---

## 🛠️ Development

### Project Structure
```
packages/
├── web/                 # Next.js frontend
│   ├── src/app/        # App router pages
│   ├── src/components/ # Reusable UI components
│   ├── src/services/   # API service layers
│   └── src/lib/        # Database and utilities
└── tasks/              # Python backend
    ├── migrations/     # Database schema migrations
    ├── scraper.py     # RSS feed scraper
    ├── article_filter.py # AI-powered filtering
    └── llm_processing.py # LLM integration
```

### Development Commands

**Web Frontend (Next.js)**
```bash
cd packages/web
pnpm dev          # Start development server (localhost:3000)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

**Python Backend**
```bash
cd packages/tasks
pip install -r requirements.txt  # Install dependencies
python scraper.py                # Run article scraper
make lint                        # Run code quality checks
make format                      # Format code with black and isort
```

### Environment Configuration
- `LLM_API_ENDPOINT` and `LLM_API_KEY` for AI processing
- `DASHSCOPE_API_KEY` for AI image generation (optional)
- `ADMIN_PASSWORD_HASH_ENCODED` for authentication
- Database path: `../../data/reading.db` (relative to project root)  

---

📄 Licensed under [MIT](LICENSE).  
✨ [Issues & Feature Requests](https://github.com/yourusername/reading/issues)  
