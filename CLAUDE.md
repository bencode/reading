# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Reading" is a web application that fetches articles from various online sources, uses an LLM to filter and summarize content, and presents the summarized articles in a clean web interface. The project uses a monorepo structure with pnpm workspace.

## Architecture

The codebase is organized as a pnpm workspace with two main packages:

- **`packages/web/`** - Next.js 15 frontend with TypeScript, Tailwind CSS, and Shadcn/ui components
- **`packages/tasks/`** - Python backend for article scraping, LLM summarization, and data processing

### Database

- SQLite database located at `data/reading.db` 
- Uses Better SQLite3 for web package database operations
- Python migrations managed with yoyo-migrations in `packages/tasks/migrations/`
- Schema includes articles, categories, and join tables for tagging

### Key Components

- **Article scraping**: `packages/tasks/scraper.py` handles RSS feeds and web scraping
- **LLM integration**: `packages/tasks/main.py` contains summarization logic
- **Web API**: Next.js API routes in `packages/web/src/app/api/`
- **Database layer**: `packages/web/src/lib/db.ts` and `packages/web/src/services/articleService.ts`

## Development Commands

### Web Frontend (Next.js)
Run from `packages/web/`:
- `pnpm dev` - Start development server (localhost:3000)
- `pnpm build` - Build for production  
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Python Backend
Run from `packages/tasks/`:
- `pip install -r requirements.txt` - Install dependencies
- `python scraper.py` - Run article scraper
- `python main.py` - Run LLM summarization
- `yoyo apply` - Apply database migrations
- `make lint` - Run code quality checks (flake8, black --check, isort --check)
- `make format` - Format code with black and isort
- `make check` - Run lint checks (alias for make lint)

### Workspace Level
Run from root:
- `pnpm install` - Install all workspace dependencies

## Environment Configuration

- Python backend expects `LLM_API_ENDPOINT` and `LLM_API_KEY` environment variables for LLM integration
- Database path is hardcoded relative to project root: `../../data/reading.db`

## Database Migrations

Database schema changes are managed through yoyo-migrations in `packages/tasks/migrations/`. The migration files handle:
- Initial schema creation 
- Adding join tables for categories and tags
- Schema modifications for the articles table
- Population of default categories