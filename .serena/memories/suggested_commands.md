# Development Commands

## Web Frontend (run from packages/web/)
- `pnpm dev` - Start development server (localhost:3000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking

## Python Backend (run from packages/tasks/)
- `pip install -r requirements.txt` - Install dependencies
- `python scraper.py` - Run article scraper
- `python main.py` - Run LLM summarization
- `make lint` - Run code quality checks (flake8, black --check, isort --check)
- `make format` - Format code with black and isort
- `make check` - Run lint checks (alias for make lint)

## Database Migrations (run from project root)
- `yoyo apply -d sqlite:///data/reading.db packages/tasks/migrations/` - Apply all pending migrations
- `yoyo list -d sqlite:///data/reading.db packages/tasks/migrations/` - List migration status

## Workspace (run from root)
- `pnpm install` - Install all workspace dependencies
- `pnpm db` - Open SQLite database shell

## Admin Access
- Admin backend: http://localhost:3000/admin (when running dev server)
- Generate password hash: `cd packages/web && node generate-hash.js your-password`