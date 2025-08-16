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

Create environment configuration for the Python backend:

```bash
# packages/tasks/.env
LLM_API_ENDPOINT=https://api.openai.com/v1/chat/completions
LLM_API_KEY=your_api_key_here
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

## 🛠️ Development

### Project Structure

```
packages/web/src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   └── page.tsx        # Main application
├── components/ui/       # Reusable UI components
├── lib/                # Utilities and database
└── services/           # Business logic layer

packages/tasks/
├── scraper.py          # RSS and web scraping
├── migrations/         # Database schema changes
└── requirements.txt    # Python dependencies
```

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
```
## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Happy Reading!** 📚✨

For questions, issues, or feature requests, please [open an issue](https://github.com/yourusername/reading/issues).
