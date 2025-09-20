# Project Overview

"Reading" is a web application that fetches articles from various online sources, uses an LLM to filter and summarize content, and presents the summarized articles in a clean web interface. 

## Architecture
- **Monorepo structure** using pnpm workspace
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, Shadcn/ui components (packages/web/)
- **Backend**: Python for article scraping, LLM summarization, and data processing (packages/tasks/)
- **Database**: SQLite located at `data/reading.db`

## Key Features
- Article scraping from RSS feeds and web sources
- LLM-powered article summarization and filtering
- Clean web interface for reading summarized content
- Collection system with sections and tags
- Weekly collection organization
- Admin authentication system