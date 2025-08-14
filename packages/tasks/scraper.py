import feedparser
import sqlite3
import os
import time
import requests
import json
import re
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
    """Ensures the database directory exists."""
    os.makedirs(DB_DIR, exist_ok=True)
    print("Database directory ensured.")

def get_or_create_category(conn, category_name):
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM categories WHERE name = ?", (category_name,))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        cursor.execute("INSERT INTO categories (name) VALUES (?) RETURNING id", (category_name,))
        return cursor.fetchone()[0]

def get_or_create_tag(conn, tag_name):
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        cursor.execute("INSERT INTO tags (name) VALUES (?) RETURNING id", (tag_name,))
        return cursor.fetchone()[0]

def check_article_exists(url):
    """Checks if an article with the given URL already exists in the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM articles WHERE original_url = ?", (url,))
        result = cursor.fetchone()
        return result is not None
    except Exception as e:
        print(f"Error checking if article exists: {e}")
        return False
    finally:
        conn.close()

def insert_article(article, category_name=None, tag_names=None):
    """Inserts a single article into the database, avoiding duplicates, and links categories/tags."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        # Insert article and get its ID
        cursor.execute(
            "INSERT INTO articles (title, original_url, summary, source_name, published_at) VALUES (?, ?, ?, ?, ?) RETURNING id",
            (article['title'], article['link'], article['summary'], article['source'], article['published_at'])
        )
        article_id = cursor.fetchone()[0]
        conn.commit()
        print(f"✓ Inserted new article: {article['title']} with ID {article_id}")

        # Link category
        if category_name:
            category_id = get_or_create_category(conn, category_name)
            cursor.execute("INSERT INTO article_categories (article_id, category_id) VALUES (?, ?)", (article_id, category_id))
            conn.commit()
            print(f"  └─ Linked to category: {category_name}")

        # Link tags
        if tag_names:
            for tag_name in tag_names:
                tag_id = get_or_create_tag(conn, tag_name)
                cursor.execute("INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)", (article_id, tag_id))
            conn.commit()
            print(f"  └─ Linked to tags: {', '.join(tag_names)}")

        return True  # Successfully inserted

    except sqlite3.IntegrityError:
        print(f"⚠ Article already exists (skipped): {article['title']}")
        return False  # Already exists
    except Exception as e:
        print(f"✗ Error inserting article {article['title']}: {e}")
        return False
    finally:
        conn.close()

def summarize_and_categorize_article(title, content):
    """Summarizes an article and suggests a category and tags using a generic LLM API."""
    if not LLM_API_ENDPOINT or LLM_API_ENDPOINT == "YOUR_LLM_API_ENDPOINT_HERE":
        print("LLM_API_ENDPOINT is not configured. Skipping summarization, categorization, and tagging.")
        return f"Summary: (LLM API not configured) {content[:200]}...", None, []

    print(f"Processing article for summary, category, and tags: {title}")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {LLM_API_KEY}"
    }
    prompt = f"""Please summarize the following technical article into 3-5 concise bullet points. Also, identify a single, most relevant category for this article from the following list: ['综合与必读', '编程语言与函数式编程', '前端、Web开发', '深度学习、LLM 与 AI 进展', 'Other']. If none of the categories are suitable, choose 'Other'. Finally, suggest 2-3 concise, relevant tags (single words or short phrases) for the article. Return the output as a JSON object with 'summary', 'category', and 'tags' (an array of strings) keys.

Title: {title}
Content: {content}
"""
    payload = {
        "model": "qwen-plus",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 500 # Increased max_tokens to accommodate JSON output
    }

    try:
        response = requests.post(LLM_API_ENDPOINT, headers=headers, json=payload, timeout=60) # Increased timeout
        response.raise_for_status()
        llm_output = response.json().get("choices", [{}])[0].get("message", {}).get("content", "{}")
        print(f"Raw LLM output: {llm_output}")
        
        # Attempt to extract JSON string from LLM output, in case it's wrapped in markdown or other text
        json_match = re.search(r'```json\n(.*)\n```', llm_output, re.DOTALL)
        if json_match:
            json_string = json_match.group(1)
        else:
            json_string = llm_output # Assume it's pure JSON if no markdown wrapper

        try:
            parsed_output = json.loads(json_string)
            print(f"Parsed LLM output: {parsed_output}")
            summary = "\n".join(parsed_output.get("summary", [])) if isinstance(parsed_output.get("summary"), list) else parsed_output.get("summary", f"Summary: (Parsing error) {content[:200]}...")
            category = parsed_output.get("category")
            tags = parsed_output.get("tags", [])
            return summary, category, tags
        except json.JSONDecodeError:
            print(f"Error decoding JSON from LLM response: {json_string}")
            return f"Summary: (JSON parsing error) {content[:200]}...", None, []

    except requests.exceptions.RequestException as e:
        print(f"Error calling LLM API: {e}")
        return f"Summary: (Error during LLM processing) {content[:200]}...", None, []

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

    # Different fetch limits based on source type
    feeds = {
        # High-frequency sources (news aggregators, active communities)
        "Hacker News": {"url": "https://news.ycombinator.com/rss", "limit": 30},
        "Lobsters": {"url": "https://lobste.rs/rss", "limit": 25},
        "InfoQ": {"url": "https://feed.infoq.com", "limit": 20},
        "Planet Python": {"url": "https://planetpython.org/rss20.xml", "limit": 20},
        "Smashing Magazine": {"url": "https://www.smashingmagazine.com/feed", "limit": 15},
        "CSS-Tricks": {"url": "https://css-tricks.com/feed/", "limit": 15},
        
        # Medium-frequency sources (regular publishers)
        "Real Python": {"url": "https://realpython.com/atom.xml", "limit": 10},
        "Planet Clojure": {"url": "https://planet.clojure.in/atom.xml", "limit": 10},
        "Vercel Blog": {"url": "https://vercel.com/atom", "limit": 10},
        "React Blog": {"url": "https://react.dev/blog/rss.xml", "limit": 10},
        "Google AI Blog": {"url": "https://ai.googleblog.com/feeds/posts/default", "limit": 10},
        "Hugging Face Blog": {"url": "https://huggingface.co/blog/feed.xml", "limit": 10},
        
        # Low-frequency sources (personal blogs, specialized content)
        "Martin Fowler": {"url": "https://martinfowler.com/feed.xml", "limit": 5},
        "Clojure Gazette": {"url": "https://clojure.org/feed.xml", "limit": 5},
        "Lambda the Ultimate": {"url": "http://lambda-the-ultimate.org/rss.xml", "limit": 5},
        "Overreacted (Dan Abramov)": {"url": "https://overreacted.io/rss.xml", "limit": 5},
        "Kent C. Dodds": {"url": "https://kentcdodds.com/blog/rss.xml", "limit": 5},
        "OpenAI Blog": {"url": "https://openai.com/blog/rss.xml", "limit": 5},
        "The Batch (DeepLearning.AI)": {"url": "https://www.deeplearning.ai/the-batch/feed/", "limit": 5},
        "Import AI Newsletter": {"url": "https://importai.net/feed", "limit": 5},
        "Andrej Karpathy's Blog": {"url": "https://karpathy.blog/rss.xml", "limit": 5},
        "Sebastian Raschka": {"url": "https://magazine.sebastianraschka.com/feed", "limit": 5},
    }

    for source, config in feeds.items():
        url = config["url"]
        limit = config["limit"]
        print(f"\nFetching articles from {source} (limit: {limit})...")
        feed = fetch_rss_feed(url)

        if feed:
            articles_to_process = feed.entries[:limit]

            processed_count = 0
            skipped_count = 0

            for entry in articles_to_process:
                # Check if article already exists before processing
                if check_article_exists(entry.link):
                    skipped_count += 1
                    print(f"⏭ Skipping existing article: {entry.title}")
                    continue

                published_time = time.strftime('%Y-%m-%dT%H:%M:%SZ', entry.get('published_parsed')) if entry.get('published_parsed') else None

                print(f"🔄 Processing new article: {entry.title}")
                full_content = entry.get('summary', '') if hasattr(entry, 'summary') else entry.get('description', '')
                summarized_text, category, tags = summarize_and_categorize_article(entry.title, full_content)

                article = {
                    'title': entry.title,
                    'link': entry.link,
                    'summary': summarized_text,
                    'source': source,
                    'published_at': published_time,
                }
                
                if insert_article(article, category_name=category, tag_names=tags):
                    processed_count += 1
                    print("--- Article Details ---")
                    print(f"Title: {article['title']}")
                    print(f"Link: {article['link']}")
                    print(f"Summarized Content:\n{summarized_text}")
                    print(f"Category: {category}")
                    print(f"Tags: {tags}")
                    print()

            print(f"📊 Summary for {source}: {processed_count} new articles processed, {skipped_count} existing articles skipped")


if __name__ == "__main__":
    main()
