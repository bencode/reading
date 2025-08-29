#!/usr/bin/env python3
"""
Database article cleaning script using LLM-based content filtering.

This script filters existing articles in the database and removes those
that don't meet technical content criteria.
"""

import argparse
import asyncio
import os
import sys

from dotenv import load_dotenv

from article_filter import batch_filter_articles_async
from db_operations import connect_to_database, get_db_path, init_db

# Load environment variables
load_dotenv()

# LLM configuration
LLM_CONFIG = {
    "api_endpoint": os.getenv(
        "LLM_API_ENDPOINT",
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    ),
    "api_key": os.getenv("DASHSCOPE_API_KEY", None),
}


def create_processing_state_table(conn):
    """Create table to track article processing state."""
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS article_processing_state (
            article_id INTEGER PRIMARY KEY,
            processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            filter_result TEXT,  -- 'accepted' or 'rejected'
            filter_reason TEXT
        )
    """
    )
    conn.commit()


def save_processing_result(conn, article_id, result, reason):
    """Save processing result to database."""
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT OR REPLACE INTO article_processing_state
        (article_id, filter_result, filter_reason, processed_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    """,
        (article_id, result, reason),
    )
    conn.commit()


def clear_processing_state(conn):
    """Clear all processing state records."""
    cursor = conn.cursor()
    cursor.execute("DELETE FROM article_processing_state")
    conn.commit()
    print("🗑️ Cleared all processing state records")


def get_processing_status(conn):
    """Get current processing status."""
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            COUNT(*) as total_processed,
            SUM(CASE WHEN filter_result = 'accepted' THEN 1 ELSE 0 END) as accepted,
            SUM(CASE WHEN filter_result = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM article_processing_state
    """
    )
    result = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) FROM articles WHERE deleted = 0")
    total_articles = cursor.fetchone()[0]

    return {
        "total_articles": total_articles,
        "processed": result[0] or 0,
        "accepted": result[1] or 0,
        "rejected": result[2] or 0,
        "remaining": total_articles - (result[0] or 0),
    }


def get_unprocessed_articles(conn, source=None, limit=None):
    """Get articles that haven't been processed yet."""
    cursor = conn.cursor()

    query = """
        SELECT a.id, a.title, a.summary, a.original_url, a.source_name, a.created_at
        FROM articles a
        LEFT JOIN article_processing_state aps ON a.id = aps.article_id
        WHERE a.deleted = 0 AND aps.article_id IS NULL
    """

    params = []
    if source:
        query += " AND a.source_name = ?"
        params.append(source)

    query += " ORDER BY a.created_at DESC"

    if limit:
        query += " LIMIT ?"
        params.append(limit)

    cursor.execute(query, params)

    articles = []
    for row in cursor.fetchall():
        articles.append(
            {
                "id": row[0],
                "title": row[1],
                "content": row[2],  # Using summary as content for filtering
                "original_url": row[3],
                "source_name": row[4],
                "created_at": row[5],
            }
        )

    return articles


def delete_articles_batch(conn, article_ids):
    """Delete articles by IDs (soft delete)."""
    if not article_ids:
        return 0

    placeholders = ",".join(["?" for _ in article_ids])
    cursor = conn.cursor()
    cursor.execute(
        f"""
        UPDATE articles
        SET deleted = 1
        WHERE id IN ({placeholders})
    """,
        article_ids,
    )

    conn.commit()
    return cursor.rowcount


async def process_articles_async(conn, args):
    """Async processing of articles with state tracking."""
    # Create processing state table
    create_processing_state_table(conn)

    # Handle reset option
    if args.reset:
        clear_processing_state(conn)
        print("🔄 Reset processing state")

    # Handle status option
    if args.status:
        status = get_processing_status(conn)
        print("📊 Processing Status:")
        print(f"   Total articles: {status['total_articles']}")
        print(f"   Processed: {status['processed']}")
        print(f"   Accepted: {status['accepted']}")
        print(f"   Rejected: {status['rejected']}")
        print(f"   Remaining: {status['remaining']}")
        return 0

    # Get unprocessed articles
    articles_to_process = get_unprocessed_articles(conn, args.source, args.limit)

    if not articles_to_process:
        print("🎉 All articles have been processed!")
        status = get_processing_status(conn)
        print(f"📊 Final Status: {status['accepted']} accepted, {status['rejected']} rejected")
        return 0

    total_articles = len(articles_to_process)
    print(f"📊 Articles to process: {total_articles}")

    # Show current status
    status = get_processing_status(conn)
    if status["processed"] > 0:
        print(f"📈 Previous progress: {status['processed']} processed, {status['remaining']} remaining")

    # Confirmation
    if not args.dry_run and not args.confirm:
        response = input(
            f"\n⚠️  This will analyze and potentially DELETE articles from the database.\n"
            f"   Articles to process: {total_articles}\n"
            f"   Continue? (y/N): "
        )
        if response.lower() != "y":
            print("❌ Operation cancelled.")
            return 0

    print("\n🚀 Starting async LLM-based article filtering...")
    print(f"   Mode: {'DRY RUN' if args.dry_run else 'LIVE DELETION'}")
    print(f"   Concurrent requests: {args.concurrent}")

    # Batch filter articles using async
    accepted, rejected = await batch_filter_articles_async(
        articles_to_process, LLM_CONFIG, batch_size=args.batch_size, max_concurrent=args.concurrent
    )

    # Save processing results to database
    print("💾 Saving processing results...")
    for article in accepted:
        save_processing_result(conn, article["id"], "accepted", "Meets technical criteria")

    for article, reason in rejected:
        save_processing_result(conn, article["id"], "rejected", reason)

    # Prepare deletion list
    articles_to_delete = [article["id"] for article, reason in rejected]

    print("\n📋 Filtering Results:")
    print(f"✅ Articles to keep: {len(accepted)}")
    print(f"❌ Articles to delete: {len(rejected)}")

    # Show some examples of rejected articles
    if rejected:
        print("\n🚫 Sample rejected articles:")
        for i, (article, reason) in enumerate(rejected[:5]):
            print(f"   {i+1}. [{article['source_name']}] {article['title']}")
            print(f"      Reason: {reason}")

        if len(rejected) > 5:
            print(f"   ... and {len(rejected) - 5} more")

    # Execute deletion
    if articles_to_delete:
        if args.dry_run:
            print(f"\n🔍 DRY RUN: Would delete {len(articles_to_delete)} articles")
        else:
            print(f"\n🗑️  Deleting {len(articles_to_delete)} articles...")
            deleted_count = delete_articles_batch(conn, articles_to_delete)
            print(f"✅ Successfully deleted {deleted_count} articles")
    else:
        print("\n🎉 All processed articles passed the filter! No deletions needed.")

    return 0


def main():
    parser = argparse.ArgumentParser(description="Clean database articles using LLM filtering")
    parser.add_argument(
        "--dry-run", action="store_true", help="Show what would be deleted without actually deleting"
    )
    parser.add_argument("--batch-size", type=int, default=10, help="Batch size for processing (default: 10)")
    parser.add_argument("--limit", type=int, help="Limit number of articles to process (for testing)")
    parser.add_argument("--source", type=str, help="Filter articles from specific source only")
    parser.add_argument(
        "--confirm", action="store_true", help="Skip confirmation prompt and proceed directly"
    )
    parser.add_argument("--reset", action="store_true", help="Clear processing state and start over")
    parser.add_argument("--status", action="store_true", help="Show current processing status and exit")
    parser.add_argument("--concurrent", type=int, default=5, help="Max concurrent API requests (default: 5)")

    args = parser.parse_args()

    # Handle status-only requests without LLM config
    if args.status:
        try:
            init_db()
            conn = connect_to_database()
            print(f"📂 Connected to database: {get_db_path()}")
            return asyncio.run(process_articles_async(conn, args))
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return 1
        finally:
            if "conn" in locals():
                conn.close()

    # Check LLM configuration for other operations
    if not LLM_CONFIG.get("api_key"):
        print("❌ Error: LLM API key not configured!")
        print("Please set DASHSCOPE_API_KEY environment variable.")
        return 1

    print("🗃️  Reading Database Article Cleaner")
    print("=" * 50)

    # Initialize database connection
    try:
        init_db()
        conn = connect_to_database()
        print(f"📂 Connected to database: {get_db_path()}")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return 1

    try:
        return asyncio.run(process_articles_async(conn, args))
    except KeyboardInterrupt:
        print("\n❌ Operation interrupted by user.")
        return 1
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    sys.exit(main())
