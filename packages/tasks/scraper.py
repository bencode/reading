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
        print(f"Inserted article: {article['title']} with ID {article_id}")

        # Link category
        if category_name:
            category_id = get_or_create_category(conn, category_name)
            print(f"Category ID for '{category_name}': {category_id}")
            cursor.execute("INSERT INTO article_categories (article_id, category_id) VALUES (?, ?)", (article_id, category_id))
            conn.commit()
            print(f"Linked article {article_id} to category: {category_name}")

        # Link tags
        if tag_names:
            for tag_name in tag_names:
                tag_id = get_or_create_tag(conn, tag_name)
                print(f"Tag ID for '{tag_name}': {tag_id}")
                cursor.execute("INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)", (article_id, tag_id))
            conn.commit()
            print(f"Linked article {article_id} to tags: {tag_names}")

    except sqlite3.IntegrityError:
        print(f"Article already exists: {article['title']}")
    except Exception as e:
        print(f"An error occurred while inserting article {article['title']}: {e}")
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

    feeds = {
        "Hacker News": "https://news.ycombinator.com/rss",
        "Lobsters": "https://lobste.rs/rss",
        "InfoQ": "https://feed.infoq.com",
        "Martin Fowler": "https://martinfowler.com/feed.xml",
        "Planet Python": "https://planetpython.org/rss20.xml",
        "Real Python": "https://realpython.com/atom.xml",
        "Planet Clojure": "https://planet.clojure.in/atom.xml",
        "Clojure Gazette": "https://clojure.org/feed.xml",
        "Lambda the Ultimate": "http://lambda-the-ultimate.org/rss.xml",
        "Vercel Blog": "https://vercel.com/atom",
        "React Blog": "https://react.dev/blog/rss.xml",
        "Smashing Magazine": "https://www.smashingmagazine.com/feed",
        "CSS-Tricks": "https://css-tricks.com/feed/",
        "Overreacted (Dan Abramov)": "https://overreacted.io/rss.xml",
        "Kent C. Dodds": "https://kentcdodds.com/blog/rss.xml",
        "OpenAI Blog": "https://openai.com/blog/rss.xml",
        "Google AI Blog": "https://ai.googleblog.com/feeds/posts/default",
        "Hugging Face Blog": "https://huggingface.co/blog/feed.xml",
        "The Batch (DeepLearning.AI)": "https://www.deeplearning.ai/the-batch/feed/",
        "Import AI Newsletter": "https://importai.net/feed",
        "Andrej Karpathy's Blog": "https://karpathy.blog/rss.xml",
        "Sebastian Raschka": "https://magazine.sebastianraschka.com/feed",
    }

    for source, url in feeds.items():
        print(f"\nFetching articles from {source}...")
        feed = fetch_rss_feed(url)

        if feed:
            articles_to_process = feed.entries[:3] # Process first 3 articles from each feed for testing

            for entry in articles_to_process:
                published_time = time.strftime('%Y-%m-%dT%H:%M:%SZ', entry.get('published_parsed')) if entry.get('published_parsed') else None

                full_content = entry.get('summary', '') if hasattr(entry, 'summary') else entry.get('description', '')
                summarized_text, category, tags = summarize_and_categorize_article(entry.title, full_content)

                article = {
                    'title': entry.title,
                    'link': entry.link,
                    'summary': summarized_text,
                    'source': source,
                    'published_at': published_time,
                }
                insert_article(article, category_name=category, tag_names=tags)
                print("\n--- Article Processed ---")
                print(f"Title: {article['title']}")
                print(f"Link: {article['link']}")
                print(f"Summarized Content:\n{summarized_text}")
                print(f"Category: {category}")
                print(f"Tags: {tags}")


if __name__ == "__main__":
    main()
