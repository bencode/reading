# Reading - Intelligent Article Aggregator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Reading** is an AI-powered RSS aggregator that collects, filters, and organizes tech articles for efficient daily reading.  
🌐 **Demo**: [reading.qijun.io](https://reading.qijun.io/) · 📋 [RSS Sources](packages/tasks/rss_config.yaml)

---

## 🌟 Features

### 📰 Smart Collection
- RSS integration & web scraping  
- AI-powered classification & tagging  

### 🤖 AI Processing
- Automatic summarization  
- Content filtering by interest  
- Smart categorization  

### 🛠️ Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind, Shadcn/ui  
- **Backend**: Python 3.8+, SQLite, RSS parser, LLM APIs  

---

## 🚀 Quick Start
```bash
git clone https://github.com/yourusername/reading.git
cd reading
pnpm install
cd packages/tasks && pip install -r requirements.txt
```

1. Configure `.env` (API keys, DB, tokens)  
2. Initialize DB: `yoyo apply`  
3. Start services:  
   ```bash
   cd packages/web && pnpm dev
   cd packages/tasks && python scraper.py
   ```

Visit `http://localhost:3000` to explore!  

---

## 🔐 Security
- Public (read-only) or authenticated (full control) access  
- Access tokens, JWT, and password protection  

---

## 🐳 Docker Deployment
```bash
./scripts/deploy.sh
```
- Web: Next.js frontend  
- Scraper: scheduled article collection  
- SQLite with volume persistence  

---

## 💾 Data Management
```bash
./scripts/data-manager.sh backup   # Backup
./scripts/data-manager.sh restore  # Restore
./scripts/data-manager.sh export   # Export SQL dump

# Article Quality Management
# Note: Run database migrations first if using the cleaner for the first time
yoyo apply  # Run this once to create the processing state table
./scripts/clean-database.sh --dry-run              # Preview articles to be removed
./scripts/clean-database.sh --source "Hacker News" # Clean specific source  
./scripts/clean-database.sh --limit 50 --dry-run   # Test on limited articles
./scripts/clean-database.sh --status               # Check processing status
./scripts/clean-database.sh --reset                # Clear state and restart
./scripts/clean-database.sh --confirm              # Execute cleanup
```

---

## 🛠️ Development
- Modular Python backend (scraper, DB, LLM integration)  
- Next.js + TypeScript frontend  
- Linting & formatting for both stacks  

---

📄 Licensed under [MIT](LICENSE).  
✨ [Issues & Feature Requests](https://github.com/yourusername/reading/issues)  
