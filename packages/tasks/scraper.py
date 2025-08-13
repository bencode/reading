import feedparser
import sqlite3
import os
import time
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database setup
DB_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
DB_PATH = os.path.join(DB_DIR, 'reading.db')

# Placeholder for LLM API configuration
# It's recommended to use environment variables for sensitive information like API keys
LLM_API_ENDPOINT = os.getenv("LLM_API_ENDPOINT", "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions")
LLM_API_KEY = os.getenv("DASHSCOPE_API_KEY", "YOUR_LLM_API_KEY_HERE")

def init_db():
    """Initializes the database and creates the articles table if it doesn't exist."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        original_url TEXT NOT NULL UNIQUE,
        summary TEXT NOT NULL,
        source_name VARCHAR(100),
        published_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT FALSE,
        tags VARCHAR(255)
    );
    ''')
    conn.commit()
    conn.close()
    print("Database initialized.")

def insert_article(article):
    """Inserts a single article into the database, avoiding duplicates."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO articles (title, original_url, summary, source_name, published_at) VALUES (?, ?, ?, ?, ?)",
            (article['title'], article['link'], article['summary'], article['source'], article['published_at'])
        )
        conn.commit()
        print(f"Inserted article: {article['title']}")
    except sqlite3.IntegrityError:
        print(f"Article already exists: {article['title']}")
    except Exception as e:
        print(f"An error occurred while inserting article {article['title']}: {e}")
    finally:
        conn.close()

def summarize_article(title, content):
    """Summarizes an article using a generic LLM API."""
    if not LLM_API_ENDPOINT or LLM_API_ENDPOINT == "YOUR_LLM_API_ENDPOINT_HERE":
        print("LLM_API_ENDPOINT is not configured. Skipping summarization.")
        return f"Summary: (LLM API not configured) {content[:200]}..."

    print(f"Summarizing article: {title}")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {LLM_API_KEY}" # Adjust if your API uses a different auth method
    }
    # This prompt is a generic example. Adjust based on the specific LLM API you are using.
    prompt = f"""Please summarize the following technical article into 3-5 concise bullet points.
Title: {title}
Content: {content}
"""
    payload = {
        "model": "qwen-plus",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 300
    }

    try:
        response = requests.post(LLM_API_ENDPOINT, headers=headers, json=payload, timeout=30)
        response.raise_for_status() # Raise an exception for HTTP errors
        summary_data = response.json()
        # Adjust this based on the actual response structure of your LLM API
        return summary_data.get("choices", [{}])[0].get("message", {}).get("content", "No summary returned.")
    except requests.exceptions.RequestException as e:
        print(f"Error calling LLM API: {e}")
        return f"Summary: (Error during summarization) {content[:200]}..."

def fetch_rss_feed(feed_url):
    """Fetches and parses an RSS feed."""
    try:
        feed = feedparser.parse(feed_url)
        if feed.bozo:
            print(f"Error parsing feed {feed_url}: {feed.bozo_exception}")
            return None
        return feed
    except Exception as e:
        print(f"An error occurred while fetching the feed {feed_url}: {e}")
        return None

def main():
    """Main function to fetch, summarize, and process articles."""
    init_db()

    feeds = {
        "Hacker News": "https://news.ycombinator.com/rss",
        "TechCrunch": "https://techcrunch.com/feed/",
    }

    for source, url in feeds.items():
        print(f"\nFetching articles from {source}...")
        feed = fetch_rss_feed(url)

        if feed:
            # For MVP, let's process a limited number of articles to avoid excessive API calls
            articles_to_process = feed.entries[:5] # Process first 5 articles from each feed

            for entry in articles_to_process:
                # Convert published_parsed time struct to ISO 8601 format
                published_time = time.strftime('%Y-%m-%dT%H:%M:%SZ', entry.get('published_parsed')) if entry.get('published_parsed') else None

                # Summarize the article content
                full_content = entry.get('summary', '') if hasattr(entry, 'summary') else entry.get('description', '')
                summarized_text = summarize_article(entry.title, full_content)

                article = {
                    'title': entry.title,
                    'link': entry.link,
                    'summary': summarized_text, # Store summarized text
                    'source': source,
                    'published_at': published_time,
                }
                insert_article(article)
                print("\n--- Article Summary ---")
                print(f"Title: {article['title']}")
                print(f"Link: {article['link']}")
                print(f"Summarized Content:\n{summarized_text}")

if __name__ == "__main__":
    main()
