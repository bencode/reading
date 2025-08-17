import json
import os
import re
import sqlite3
import time

import feedparser
import requests
import yaml
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database setup
# Use environment variable if set (for Docker), otherwise use relative path
DB_PATH = os.getenv(
    "DATABASE_PATH",
    os.path.join(os.path.dirname(__file__), "..", "..", "data", "reading.db"),
)
DB_DIR = os.path.dirname(DB_PATH)

# Load RSS configuration
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "rss_config.yaml")

# Placeholder for LLM API configuration
LLM_API_ENDPOINT = os.getenv(
    "LLM_API_ENDPOINT",
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
)
LLM_API_KEY = os.getenv("DASHSCOPE_API_KEY", "YOUR_LLM_API_KEY_HERE")


def load_feeds():
    """Load and flatten all enabled RSS feeds from config."""
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    return {
        feed["name"]: {"url": feed["url"], "limit": feed["limit"]}
        for category in config["feeds"].values()
        for feed in category
        if feed.get("enabled", True)
    }


def load_classification_config():
    """Load classification rules from config."""
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    return config.get("classification", {})


def init_db():
    """Ensures the database directory exists and database file is accessible."""
    # Only create directory if it doesn't exist
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR, exist_ok=True)
        print(f"Created database directory: {DB_DIR}")
    else:
        print(f"Database directory exists: {DB_DIR}")

    # Test database accessibility and configure WAL mode
    if os.path.exists(DB_PATH):
        print(f"Database file found: {DB_PATH}")
    else:
        print(f"Database file will be created: {DB_PATH}")

    # Configure database for concurrent access
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    try:
        # Enable WAL mode for concurrent read/write access
        conn.execute("PRAGMA journal_mode = WAL;")
        # Set synchronous mode to NORMAL for better performance
        conn.execute("PRAGMA synchronous = NORMAL;")
        # Increase cache size
        conn.execute("PRAGMA cache_size = 1000;")
        # Use memory for temporary storage
        conn.execute("PRAGMA temp_store = memory;")
        print("Database configured with WAL mode for concurrent access")
    except Exception as e:
        print(f"Warning: Failed to configure database: {e}")
    finally:
        conn.close()

    print("Database initialization completed.")


def get_or_create_category(conn, category_name):
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM categories WHERE name = ?", (category_name,))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        cursor.execute("INSERT INTO categories (name) VALUES (?)", (category_name,))
        conn.commit()
        return cursor.lastrowid


def get_or_create_tag(conn, tag_name):
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        cursor.execute("INSERT INTO tags (name) VALUES (?)", (tag_name,))
        conn.commit()
        return cursor.lastrowid


# Web API configuration for article insertion
WEB_API_URL = os.getenv("WEB_API_URL", None)


def check_article_exists(conn, url):
    """Check if article exists in database."""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM articles WHERE original_url = ?", (url,))
    result = cursor.fetchone()
    return result is not None


def insert_article(conn, article, category_name=None, tag_names=None):
    """Insert article into database with categories and tags."""
    cursor = conn.cursor()

    # Insert article
    cursor.execute(
        """
        INSERT INTO articles (
            title, original_url, summary, source_name, published_at,
            is_read, starred, deleted, rating
        )
        VALUES (?, ?, ?, ?, ?, 0, 0, 0, NULL)
    """,
        (
            article["title"],
            article["link"],
            article["summary"],
            article["source"],
            article["published_at"],
        ),
    )

    article_id = cursor.lastrowid

    # Handle category
    if category_name:
        category_id = get_or_create_category(conn, category_name)
        cursor.execute(
            "INSERT INTO article_categories (article_id, category_id) VALUES (?, ?)",
            (article_id, category_id),
        )

    # Handle tags
    if tag_names:
        for tag_name in tag_names:
            tag_id = get_or_create_tag(conn, tag_name)
            cursor.execute(
                "INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)",
                (article_id, tag_id),
            )

    conn.commit()
    return article_id


def check_article_exists_api(url):
    """Check if article exists via web API."""
    api_url = f"{WEB_API_URL}/api/articles/check?url={url}"
    response = requests.get(api_url, timeout=30)
    if response.status_code == 200:
        return response.json().get("exists", False)
    return False


def insert_article_api(article, category_name=None, tag_names=None):
    """Insert article via web API."""
    payload = {
        "title": article["title"],
        "original_url": article["link"],
        "summary": article["summary"],
        "source_name": article["source"],
        "published_at": article["published_at"],
    }

    if category_name:
        payload["category_name"] = category_name

    if tag_names:
        payload["tag_names"] = tag_names

    response = requests.post(f"{WEB_API_URL}/api/articles", json=payload, timeout=30)

    if response.status_code == 201:
        result = response.json()
        print(f"✓ Inserted new article: {article['title']} with ID {result['id']}")
        if category_name:
            print(f"  └─ Linked to category: {category_name}")
        if tag_names:
            print(f"  └─ Linked to tags: {', '.join(tag_names)}")
        return True
    elif response.status_code == 409:
        print(f"⚠ Article already exists (skipped): {article['title']}")
        return False
    else:
        error_msg = response.json().get("error", "Unknown error")
        print(f"✗ Failed to insert article {article['title']}: {error_msg}")
        return False


def summarize_and_categorize_article(title, content):
    """Summarizes an article and suggests a category and tags using LLM API."""
    if not LLM_API_ENDPOINT or LLM_API_ENDPOINT == "YOUR_LLM_API_ENDPOINT_HERE":
        print("LLM_API_ENDPOINT is not configured. Skipping summarization, categorization, and tagging.")
        return f"Summary: (LLM API not configured) {content[:200]}...", None, []

    print(f"Processing article for summary, category, and tags: {title}")

    # Load classification config
    classification_config = load_classification_config()
    categories = classification_config.get("categories", [])
    prompt_template = classification_config.get("prompt_template", "")

    # Build categories list for prompt
    categories_list = "\n".join([f"- {cat['name']}: {cat['description']}" for cat in categories])

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {LLM_API_KEY}",
    }

    # Use the new classification prompt template
    classification_prompt = prompt_template.format(
        categories_list=categories_list,
        title=title,
        content=content[:1000],  # Limit content length for classification
    )

    # Separate summary and tags prompt
    summary_tags_prompt = f"""请完成以下两个任务：

1. 将技术文章总结为3-5个要点，保持简洁清晰
2. 为文章生成2-3个相关的标签（短词或短语，如"机器学习"、"性能优化"、"架构设计"等）

文章标题: {title}
文章内容: {content}

请按以下JSON格式返回：
{{"summary": "你的总结内容", "tags": ["标签1", "标签2", "标签3"]}}"""

    try:
        # First get classification
        classification_payload = {
            "model": "qwen-plus",
            "messages": [{"role": "user", "content": classification_prompt}],
            "max_tokens": 50,
        }

        response = requests.post(LLM_API_ENDPOINT, headers=headers, json=classification_payload, timeout=60)
        response.raise_for_status()
        category = response.json().get("choices", [{}])[0].get("message", {}).get("content", "Other").strip()

        # Validate category exists in our list
        valid_categories = [cat["name"] for cat in categories]
        if category not in valid_categories:
            category = "Other"

        # Then get summary and tags
        summary_tags_payload = {
            "model": "qwen-plus",
            "messages": [{"role": "user", "content": summary_tags_prompt}],
            "max_tokens": 400,
        }

        response = requests.post(LLM_API_ENDPOINT, headers=headers, json=summary_tags_payload, timeout=60)
        response.raise_for_status()
        llm_output = response.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()

        # Try to parse JSON response
        try:
            # Extract JSON from response (handle markdown code blocks)
            json_match = re.search(r"```json\n(.*?)\n```", llm_output, re.DOTALL)
            if json_match:
                json_string = json_match.group(1)
            else:
                json_string = llm_output

            parsed_output = json.loads(json_string)
            summary = parsed_output.get("summary", f"Summary: {content[:200]}...")
            tags = parsed_output.get("tags", [])

            # Ensure tags is a list and limit to 3
            if isinstance(tags, list):
                tags = tags[:3]
            else:
                tags = []

        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing JSON from LLM response: {e}")
            print(f"Raw output: {llm_output}")
            # Fallback: extract summary manually and leave tags empty
            summary = llm_output if llm_output else f"Summary: {content[:200]}..."
            tags = []

        print(f"Classification result: {category}")
        print(f"Generated tags: {tags}")

        return summary, category, tags

    except requests.exceptions.RequestException as e:
        print(f"Error calling LLM API: {e}")
        return f"Summary: (Error during LLM processing) {content[:200]}...", "Other", []


def fetch_full_article_content(url, rss_summary=""):
    """Fetch full article content from URL, fallback to RSS summary if failed."""
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            )
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, "html.parser")

        # Remove script and style elements
        for script in soup(["script", "style", "nav", "header", "footer", "aside"]):
            script.decompose()

        # Try to find main content areas (common patterns)
        content_selectors = [
            "article",
            "main",
            ".content",
            ".post-content",
            ".entry-content",
            ".article-content",
            ".post-body",
            '[role="main"]',
            ".markdown-body",
        ]

        content = ""
        for selector in content_selectors:
            elements = soup.select(selector)
            if elements:
                content = elements[0].get_text(strip=True, separator=" ")
                break

        # Fallback: get all paragraphs if no main content found
        if not content:
            paragraphs = soup.find_all("p")
            content = " ".join([p.get_text(strip=True) for p in paragraphs])

        # Clean up content
        content = re.sub(r"\s+", " ", content).strip()

        # If content is too short, use RSS summary as fallback
        if len(content) < 200:
            print(f"  ⚠ Short content extracted ({len(content)} chars), using RSS summary as fallback")
            return rss_summary

        print(f"  ✓ Extracted full content ({len(content)} chars)")
        return content

    except Exception as e:
        print(f"  ⚠ Failed to fetch full content: {e}")
        print(f"  → Using RSS summary as fallback ({len(rss_summary)} chars)")
        return rss_summary


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
    """Main function to fetch, summarize, categorize, and process articles."""
    init_db()

    # Load configuration
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        full_config = yaml.safe_load(f)

    feeds = load_feeds()
    fetch_full_content = full_config.get("settings", {}).get("fetch_full_content", False)

    # Determine if we should use API or direct database access
    use_api = WEB_API_URL is not None
    conn = None

    if not use_api:
        # Initialize database connection for direct access
        conn = sqlite3.connect(DB_PATH, timeout=30.0)
        print("Using direct database access mode")
    else:
        print(f"Using API proxy mode: {WEB_API_URL}")

    try:
        for source, feed_config in feeds.items():
            url = feed_config["url"]
            limit = feed_config["limit"]
            print(f"\nFetching articles from {source} (limit: {limit})...")
            feed = fetch_rss_feed(url)

            if feed:
                articles_to_process = feed.entries[:limit]

                processed_count = 0
                skipped_count = 0

                for entry in articles_to_process:
                    # Check if article already exists before processing
                    if use_api:
                        article_exists = check_article_exists_api(entry.link)
                    else:
                        article_exists = check_article_exists(conn, entry.link)

                    if article_exists:
                        skipped_count += 1
                        print(f"⏭ Skipping existing article: {entry.title}")
                        continue

                    published_time = (
                        time.strftime("%Y-%m-%dT%H:%M:%SZ", entry.get("published_parsed"))
                        if entry.get("published_parsed")
                        else None
                    )

                    print(f"🔄 Processing new article: {entry.title}")
                    rss_content = (
                        entry.get("summary", "")
                        if hasattr(entry, "summary")
                        else entry.get("description", "")
                    )

                    # Fetch full article content if enabled
                    if fetch_full_content:
                        full_content = fetch_full_article_content(entry.link, rss_content)
                    else:
                        full_content = rss_content
                        print(f"  → Using RSS content ({len(full_content)} chars)")

                    summarized_text, category, tags = summarize_and_categorize_article(
                        entry.title, full_content
                    )

                    article = {
                        "title": entry.title,
                        "link": entry.link,
                        "summary": summarized_text,
                        "source": source,
                        "published_at": published_time,
                    }

                    # Insert article using appropriate method
                    if use_api:
                        success = insert_article_api(article, category_name=category, tag_names=tags)
                    else:
                        article_id = insert_article(conn, article, category_name=category, tag_names=tags)
                        print(f"✓ Inserted new article: {article['title']} with ID {article_id}")
                        if category:
                            print(f"  └─ Linked to category: {category}")
                        if tags:
                            print(f"  └─ Linked to tags: {', '.join(tags)}")
                        success = True

                    if success:
                        processed_count += 1
                        print("--- Article Details ---")
                        print(f"Title: {article['title']}")
                        print(f"Link: {article['link']}")
                        print(f"Summarized Content:\n{summarized_text}")
                        print(f"Category: {category}")
                        print(f"Tags: {tags}")
                        print()

                print(
                    f"📊 Summary for {source}: {processed_count} new articles processed, "
                    f"{skipped_count} existing articles skipped"
                )

    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    main()
