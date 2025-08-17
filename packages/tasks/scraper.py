import os

import feedparser
import yaml
from dotenv import load_dotenv

from article_processing import (
    check_article_exists_api,
    create_article_dict,
    get_article_content,
    get_published_time,
    insert_article_api,
)
from db_operations import check_article_exists, connect_to_database, init_db, insert_article
from llm_processing import summarize_and_categorize_article

# Load environment variables from .env file
load_dotenv()

# Load RSS configuration
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "rss_config.yaml")

# Web API configuration for article insertion
WEB_API_URL = os.getenv("WEB_API_URL", None)

# LLM configuration
LLM_CONFIG = {
    "api_endpoint": os.getenv(
        "LLM_API_ENDPOINT",
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    ),
    "api_key": os.getenv("DASHSCOPE_API_KEY", None),
}


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


def _setup_database_connection():
    """Setup database connection based on configuration."""
    use_api = WEB_API_URL is not None
    conn = None

    if not use_api:
        init_db()
        conn = connect_to_database()
        print("Using direct database access mode")
    else:
        print(f"Using API proxy mode: {WEB_API_URL}")

    return use_api, conn


def _get_article_content(entry, fetch_full_content):
    """Get article content from RSS or full fetch."""
    return get_article_content(entry, fetch_full_content)


def _create_article_dict(entry, summarized_text, source, published_time):
    """Create article dictionary for insertion."""
    return create_article_dict(entry, summarized_text, source, published_time)


def _insert_article_with_method(article, category, tags, use_api, conn):
    """Insert article using appropriate method (API or direct DB)."""
    if use_api:
        return insert_article_api(article, category_name=category, tag_names=tags)
    else:
        article_id = insert_article(conn, article, category_name=category, tag_names=tags)
        print(f"✓ Inserted new article: {article['title']} with ID {article_id}")
        if category:
            print(f"  └─ Linked to category: {category}")
        if tags:
            print(f"  └─ Linked to tags: {', '.join(tags)}")
        return True


def _print_article_details(article, summarized_text, category, tags):
    """Print detailed article information."""
    print("--- Article Details ---")
    print(f"Title: {article['title']}")
    print(f"Link: {article['link']}")
    print(f"Summarized Content:\n{summarized_text}")
    print(f"Category: {category}")
    print(f"Tags: {tags}")
    print()


def _process_single_article(entry, use_api, conn, fetch_full_content, source):
    """Process a single RSS entry into an article."""
    # Check if article already exists
    if use_api:
        article_exists = check_article_exists_api(entry.link)
    else:
        article_exists = check_article_exists(conn, entry.link)

    if article_exists:
        print(f"⏭ Skipping existing article: {entry.title}")
        return False, None

    # Process new article
    published_time = get_published_time(entry)

    print(f"🔄 Processing new article: {entry.title}")
    full_content = _get_article_content(entry, fetch_full_content)
    summarized_text, category, tags = summarize_and_categorize_article(entry.title, full_content, LLM_CONFIG)

    article = _create_article_dict(entry, summarized_text, source, published_time)
    success = _insert_article_with_method(article, category, tags, use_api, conn)

    if success:
        _print_article_details(article, summarized_text, category, tags)

    return success, (article, summarized_text, category, tags)


def _process_feed_source(source, feed_config, use_api, conn, fetch_full_content):
    """Process all articles from a single RSS feed source."""
    url = feed_config["url"]
    limit = feed_config["limit"]
    print(f"\nFetching articles from {source} (limit: {limit})...")

    feed = fetch_rss_feed(url)
    if not feed:
        return 0, 0

    articles_to_process = feed.entries[:limit]
    processed_count = 0
    skipped_count = 0

    for entry in articles_to_process:
        success, _ = _process_single_article(entry, use_api, conn, fetch_full_content, source)
        if success:
            processed_count += 1
        else:
            skipped_count += 1

    print(
        f"📊 Summary for {source}: {processed_count} new articles processed, "
        f"{skipped_count} existing articles skipped"
    )

    return processed_count, skipped_count


def main():
    """Main function to fetch, summarize, categorize, and process articles."""
    # Load configuration
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        full_config = yaml.safe_load(f)

    feeds = load_feeds()
    fetch_full_content = full_config.get("settings", {}).get("fetch_full_content", False)

    # Setup database connection
    use_api, conn = _setup_database_connection()

    try:
        for source, feed_config in feeds.items():
            _process_feed_source(source, feed_config, use_api, conn, fetch_full_content)
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    main()
