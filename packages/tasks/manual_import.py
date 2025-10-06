"""Manual article import from URL - local version with Playwright."""

import json
import os
import re
import sys
from datetime import datetime

import requests
from bs4 import BeautifulSoup
from dateutil import parser as date_parser
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

from article_filter import filter_article_content
from llm_processing import summarize_and_categorize_article

load_dotenv()

LLM_CONFIG = {
    "api_endpoint": os.getenv(
        "LLM_API_ENDPOINT",
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    ),
    "api_key": os.getenv("DASHSCOPE_API_KEY", None),
}


def fetch_html_with_playwright(url):
    """Fetch HTML content using Playwright."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Set user agent
        page.set_extra_http_headers({
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
        })

        # Navigate and wait for content
        page.goto(url, wait_until="networkidle")

        # Get HTML content
        html_content = page.content()

        browser.close()

        return html_content


def extract_article_content(html_content):
    """Extract main article content from HTML."""
    soup = BeautifulSoup(html_content, "html.parser")

    # Remove unwanted elements
    for element in soup(["script", "style", "nav", "header", "footer", "aside"]):
        element.decompose()

    # Try common content selectors
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

    # Fallback: get all paragraphs
    if not content:
        paragraphs = soup.find_all("p")
        content = " ".join([p.get_text(strip=True) for p in paragraphs])

    # Clean up whitespace
    content = re.sub(r"\s+", " ", content).strip()
    return content


def _extract_title(soup, url):
    """Extract article title from HTML."""
    title_tag = soup.title.string if soup.title else ""
    og_title = soup.find("meta", property="og:title")
    return (
        og_title.get("content") if og_title
        else title_tag or url.split("/")[-1].replace("-", " ").replace("_", " ")
    )


def _extract_date_from_meta(soup):
    """Extract publication date from meta tags."""
    date_selectors = [
        ("meta", {"property": "article:published_time"}),
        ("meta", {"name": "publish_date"}),
        ("meta", {"name": "publication_date"}),
        ("meta", {"property": "og:published_time"}),
        ("meta", {"name": "date"}),
        ("meta", {"itemprop": "datePublished"}),
        ("time", {"datetime": True}),
    ]

    for tag_name, attrs in date_selectors:
        tag = soup.find(tag_name, attrs)
        if tag:
            date_str = tag.get("content") or tag.get("datetime")
            if date_str:
                try:
                    parsed_date = date_parser.parse(date_str)
                    result = parsed_date.strftime("%Y-%m-%dT%H:%M:%SZ")
                    print(f"  ✓ Found published date from meta tag: {result}")
                    return result
                except (ValueError, TypeError):
                    continue
    return None


def _extract_date_from_text(soup):
    """Extract publication date from visible text."""
    paragraphs = soup.find_all(['p', 'time', 'span'])
    date_patterns = [
        r'Published\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})',  # Published Sep 29, 2025
        r'(\d{4}-\d{2}-\d{2})',  # 2025-09-29
        r'([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})',  # Sep 29, 2025
    ]

    for p in paragraphs[:20]:
        text = p.get_text(strip=True)
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                date_str = match.group(1) if match.lastindex else match.group(0)
                try:
                    parsed_date = date_parser.parse(date_str)
                    result = parsed_date.strftime("%Y-%m-%dT%H:%M:%SZ")
                    print(f"  ✓ Found published date from text: {result}")
                    return result
                except (ValueError, TypeError):
                    continue
    return None


def _extract_date_with_llm(soup, url, llm_config):
    """Extract publication date using LLM."""
    head_html = str(soup.head) if soup.head else ""
    prompt = f"""Extract article publication date from the following HTML head section.

URL: {url}
HTML Head (first 2000 chars):
{head_html[:2000]}

Please extract the publication date and convert it to ISO format (YYYY-MM-DDTHH:MM:SSZ).
If you cannot find a publication date, return null.

Return JSON format:
{{"published_at": "2024-01-01T00:00:00Z"}}

or

{{"published_at": null}}"""

    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {llm_config['api_key']}",
        }
        payload = {
            "model": "qwen-plus",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 100,
        }

        response = requests.post(llm_config["api_endpoint"], headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        llm_output = response.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()

        # Parse JSON from LLM response
        json_match = re.search(r"```json\n(.*?)\n```", llm_output, re.DOTALL)
        json_string = json_match.group(1) if json_match else llm_output

        metadata = json.loads(json_string)
        return metadata.get("published_at")

    except Exception as e:
        print(f"  ⚠ LLM date extraction failed: {e}")
        return None


def extract_article_metadata_with_llm(html_content, url, llm_config):
    """Extract article metadata (title and published date)."""
    soup = BeautifulSoup(html_content, "html.parser")

    title = _extract_title(soup, url)

    # Try multiple strategies to extract date
    published_at = (
        _extract_date_from_meta(soup) or
        _extract_date_from_text(soup) or
        (
            _extract_date_with_llm(soup, url, llm_config)
            if llm_config and llm_config.get("api_endpoint") and llm_config.get("api_key")
            else None
        )
    )

    # Fallback to current time if no date found
    if not published_at:
        published_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        print(f"  ℹ No publication date found, using current time")

    return {
        "title": title,
        "published_at": published_at,
    }


def process_url_to_json(url, source_name="manual"):
    """Process URL and output JSON data."""
    print(f"\n🔗 Processing URL: {url}")

    # Fetch HTML content
    try:
        html_content = fetch_html_with_playwright(url)
        print(f"  ✓ Fetched HTML content using Playwright")
    except Exception as e:
        print(f"  ✗ Failed to fetch URL: {e}")
        return None

    # Extract metadata using LLM
    metadata = extract_article_metadata_with_llm(html_content, url, LLM_CONFIG)
    print(f"  ✓ Extracted metadata: {metadata['title']}")

    # Extract article content
    content = extract_article_content(html_content)
    if len(content) < 100:
        print(f"  ✗ Content too short ({len(content)} chars)")
        return None

    print(f"  ✓ Extracted content ({len(content)} chars)")

    # Filter article content
    should_include, filter_reason = filter_article_content(metadata["title"], content, LLM_CONFIG)
    if not should_include:
        print(f"  🚫 Article filtered out: {filter_reason}")
        return None

    # Summarize and categorize
    print(f"  🔄 Processing with LLM...")
    summarized_text, category, tags = summarize_and_categorize_article(metadata["title"], content, LLM_CONFIG)

    # Create output data
    output_data = {
        "title": metadata["title"],
        "original_url": url,
        "summary": summarized_text,
        "source_name": source_name,
        "published_at": metadata["published_at"],
        "category_name": category,
        "tag_names": tags,
    }

    return output_data


def main():
    """Command line interface for manual article import."""
    if len(sys.argv) < 2:
        print("Usage: python manual_import.py <url> [source_name]")
        sys.exit(1)

    url = sys.argv[1]
    source_name = sys.argv[2] if len(sys.argv) > 2 else "manual"

    result = process_url_to_json(url, source_name)

    if result:
        print("\n" + "=" * 80)
        print("✅ Article processed successfully!")
        print("=" * 80)
        print("\nCopy the JSON below and paste it into the web interface:\n")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        print("\n" + "=" * 80)
    else:
        print("\n❌ Failed to process article")
        sys.exit(1)


if __name__ == "__main__":
    main()
