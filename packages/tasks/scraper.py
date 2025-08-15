import feedparser
import sqlite3
import os
import time
import requests
import json
import re
import yaml
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database setup
DB_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
DB_PATH = os.path.join(DB_DIR, 'reading.db')

# Load RSS configuration
CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'rss_config.yaml')

# Placeholder for LLM API configuration
LLM_API_ENDPOINT = os.getenv("LLM_API_ENDPOINT", "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions")
LLM_API_KEY = os.getenv("DASHSCOPE_API_KEY", "YOUR_LLM_API_KEY_HERE")

def load_feeds():
    """Load and flatten all enabled RSS feeds from config."""
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    return {
        feed['name']: {"url": feed['url'], "limit": feed['limit']}
        for category in config['feeds'].values()
        for feed in category
        if feed.get('enabled', True)
    }

def load_classification_config():
    """Load classification rules from config."""
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    return config.get('classification', {})

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
        cursor.execute("INSERT INTO categories (name) VALUES (?)", (category_name,))
        return cursor.lastrowid

def get_or_create_tag(conn, tag_name):
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        cursor.execute("INSERT INTO tags (name) VALUES (?)", (tag_name,))
        return cursor.lastrowid

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
    conn = sqlite3.connect(DB_PATH, timeout=20.0)  # Add timeout for database locks
    cursor = conn.cursor()
    try:
        # Insert article and get its ID
        cursor.execute(
            "INSERT INTO articles (title, original_url, summary, source_name, published_at) VALUES (?, ?, ?, ?, ?)",
            (article['title'], article['link'], article['summary'], article['source'], article['published_at'])
        )
        article_id = cursor.lastrowid  # Use lastrowid instead of RETURNING
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

    except sqlite3.IntegrityError as e:
        print(f"⚠ Article already exists (skipped): {article['title']} - {e}")
        return False  # Already exists
    except sqlite3.OperationalError as e:
        print(f"✗ Database locked or operational error: {e}")
        print(f"  Article: {article['title']}")
        return False
    except Exception as e:
        print(f"✗ Error inserting article {article['title']}: {e}")
        print(f"  Error type: {type(e).__name__}")
        return False
    finally:
        conn.close()

def summarize_and_categorize_article(title, content):
    """Summarizes an article and suggests a category and tags using a generic LLM API."""
    if not LLM_API_ENDPOINT or LLM_API_ENDPOINT == "YOUR_LLM_API_ENDPOINT_HERE":
        print("LLM_API_ENDPOINT is not configured. Skipping summarization, categorization, and tagging.")
        return f"Summary: (LLM API not configured) {content[:200]}...", None, []

    print(f"Processing article for summary, category, and tags: {title}")
    
    # Load classification config
    classification_config = load_classification_config()
    categories = classification_config.get('categories', [])
    prompt_template = classification_config.get('prompt_template', '')
    
    # Build categories list for prompt
    categories_list = '\n'.join([f"- {cat['name']}: {cat['description']}" for cat in categories])
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {LLM_API_KEY}"
    }
    
    # Use the new classification prompt template
    classification_prompt = prompt_template.format(
        categories_list=categories_list,
        title=title,
        content=content[:1000]  # Limit content length for classification
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
            "messages": [
                {"role": "user", "content": classification_prompt}
            ],
            "max_tokens": 50
        }
        
        response = requests.post(LLM_API_ENDPOINT, headers=headers, json=classification_payload, timeout=60)
        response.raise_for_status()
        category = response.json().get("choices", [{}])[0].get("message", {}).get("content", "Other").strip()
        
        # Validate category exists in our list
        valid_categories = [cat['name'] for cat in categories]
        if category not in valid_categories:
            category = "Other"
        
        # Then get summary and tags
        summary_tags_payload = {
            "model": "qwen-plus", 
            "messages": [
                {"role": "user", "content": summary_tags_prompt}
            ],
            "max_tokens": 400
        }
        
        response = requests.post(LLM_API_ENDPOINT, headers=headers, json=summary_tags_payload, timeout=60)
        response.raise_for_status()
        llm_output = response.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        
        # Try to parse JSON response
        try:
            # Extract JSON from response (handle markdown code blocks)
            json_match = re.search(r'```json\n(.*?)\n```', llm_output, re.DOTALL)
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

    feeds = load_feeds()
    
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
