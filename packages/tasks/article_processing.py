"""Article processing utilities for scraper."""

import time

import requests
from bs4 import BeautifulSoup


def check_article_exists_api(url):
    """Check if article exists via web API."""
    from scraper import WEB_API_URL  # Avoid circular import

    api_url = f"{WEB_API_URL}/api/articles/check?url={url}"
    response = requests.get(api_url, timeout=30)
    if response.status_code == 200:
        return response.json().get("exists", False)
    return False


def insert_article_api(article, category_name=None, tag_names=None):
    """Insert article via web API."""
    from scraper import WEB_API_URL  # Avoid circular import

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
        import re

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


def get_article_content(entry, fetch_full_content):
    """Get article content from RSS or full fetch."""
    rss_content = entry.get("summary", "") if hasattr(entry, "summary") else entry.get("description", "")

    if fetch_full_content:
        return fetch_full_article_content(entry.link, rss_content)
    else:
        print(f"  → Using RSS content ({len(rss_content)} chars)")
        return rss_content


def create_article_dict(entry, summarized_text, source, published_time):
    """Create article dictionary for insertion."""
    return {
        "title": entry.title,
        "link": entry.link,
        "summary": summarized_text,
        "source": source,
        "published_at": published_time,
    }


def get_published_time(entry):
    """Extract published time from RSS entry."""
    return (
        time.strftime("%Y-%m-%dT%H:%M:%SZ", entry.get("published_parsed"))
        if entry.get("published_parsed")
        else None
    )
