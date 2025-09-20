# Tech Stack

## Frontend (packages/web/)
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS (v4)
- **Components**: Shadcn/ui, Radix UI primitives
- **Icons**: Lucide React, Radix Icons
- **Database**: Better SQLite3 with Knex.js
- **Authentication**: bcryptjs + JWT
- **Markdown**: react-markdown with remark-gfm

## Backend (packages/tasks/)
- **Language**: Python
- **Dependencies**: feedparser, requests, aiohttp, beautifulsoup4
- **Migrations**: yoyo-migrations
- **Config**: python-dotenv for environment management

## Database
- **Type**: SQLite
- **Location**: data/reading.db
- **Schema**: articles, collections, collection_sections, categories, tags, join tables

## Development Tools
- **Package Manager**: pnpm (workspace)
- **Linting**: ESLint (frontend), flake8 (backend)
- **Formatting**: Prettier (frontend), black + isort (backend)
- **Type Checking**: TypeScript