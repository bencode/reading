"""Database operations module for article management."""

import os
import sqlite3


def get_db_path():
    """Get database path from environment or default location."""
    return os.getenv(
        "DATABASE_PATH",
        os.path.join(os.path.dirname(__file__), "..", "..", "data", "reading.db"),
    )


def init_db():
    """Initialize database with proper configuration for concurrent access."""
    db_path = get_db_path()
    db_dir = os.path.dirname(db_path)

    # Create directory if it doesn't exist
    if not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
        print(f"Created database directory: {db_dir}")
    else:
        print(f"Database directory exists: {db_dir}")

    # Check database file status
    if os.path.exists(db_path):
        print(f"Database file found: {db_path}")
    else:
        print(f"Database file will be created: {db_path}")

    # Configure database for concurrent access
    conn = sqlite3.connect(db_path, timeout=30.0)
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
    """Get existing category ID or create new category."""
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
    """Get existing tag ID or create new tag."""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        cursor.execute("INSERT INTO tags (name) VALUES (?)", (tag_name,))
        conn.commit()
        return cursor.lastrowid


def check_article_exists(conn, url):
    """Check if article exists in database by URL."""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM articles WHERE original_url = ?", (url,))
    result = cursor.fetchone()
    return result is not None


def insert_article(conn, article, category_name=None, tag_names=None):
    """Insert article into database with optional categories and tags."""
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


def connect_to_database():
    """Create and return database connection."""
    db_path = get_db_path()
    return sqlite3.connect(db_path, timeout=30.0)
