# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Reading" is a web application that fetches articles from various online sources, uses an LLM to filter and summarize content, and presents the summarized articles in a clean web interface. The project uses a monorepo structure with pnpm workspace.

## Architecture

The codebase is organized as a pnpm workspace with two main packages:

- **`packages/web/`** - Next.js 15 frontend (App Router) with TypeScript, Tailwind CSS v4, and Shadcn/ui
- **`packages/tasks/`** - Python backend for article scraping, LLM summarization, and data processing

### Article Pipeline

1. `scraper.py` fetches RSS feeds configured in `rss_config.yaml` (50+ sources)
2. `article_filter.py` pre-filters articles with LLM (ACCEPT/REJECT) to reduce processing cost
3. `llm_processing.py` summarizes accepted articles, categorizes them, and generates tags
4. Articles are stored in SQLite via `db_operations.py`
5. Web frontend reads from the same SQLite database via Knex.js + better-sqlite3

### Web Service Layer

- **Database**: `src/lib/db.ts` — Knex.js singleton with better-sqlite3, WAL mode
- **Services**: `src/services/article/` — split into `readers.ts`, `writers.ts`, `actions.ts` with `types.ts`
- **Auth**: JWT-based with bcrypt password hashing. Protected API routes use `withAuth()` wrapper from `src/lib/auth.ts`
- **API routes**: RESTful handlers in `src/app/api/`
- **AI features**: Image generation (DashScope), text optimization, prompt generation — all via API routes

### Database

- SQLite at `data/reading.db` (path hardcoded as `../../data/reading.db` from web package)
- Schema: articles, categories, tags with join tables; collections + collection_sections for weekly issues
- Migrations managed with yoyo-migrations in `packages/tasks/migrations/`

## Development Commands

### Web Frontend (packages/web/)
- `pnpm dev` - Start development server (localhost:3000)
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking

### Python Backend (packages/tasks/)
- `python scraper.py` - Run article scraper
- `python main.py` - Run LLM summarization
- `make lint` - Run code quality checks (flake8, black --check, isort --check)
- `make format` - Format code with black and isort

### Database Migrations (from project root)
- `yoyo apply -d sqlite:///data/reading.db packages/tasks/migrations/`
- `yoyo list -d sqlite:///data/reading.db packages/tasks/migrations/`

### Workspace
- `pnpm install` - Install all workspace dependencies (run from root)

## Environment Configuration

- `LLM_API_ENDPOINT` and `LLM_API_KEY` — for Python LLM integration
- `DASHSCOPE_API_KEY` — for AI image generation (optional, uses placeholder if not set)
- `ADMIN_PASSWORD_HASH_ENCODED` — bcrypt hash for admin auth (generate with `node packages/web/generate-hash.js <password>`)

## Deployment

Docker Compose with services: `web` (Next.js), `imgproxy` (image optimization), `db_init` (migration runner), `tasks` (scraper, manual profile).
- `scripts/deploy.sh` — zero-downtime deployment
- `scripts/run-scraper.sh` — run scraper in Docker (for cron)

## Styling

Tailwind CSS v4 with inline theme in `globals.css` (no separate tailwind.config). Uses oklch color system with dark mode support.

## Conventions

- 系统用英文
- 重构原则：React 的 useEffect 依赖的重构，如能正常工作，则先忽略警告，除非确定功能没有影响
- No test suite exists in either package
