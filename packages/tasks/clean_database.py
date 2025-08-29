#!/usr/bin/env python3
"""
Database article cleaning script using LLM-based content filtering.

This script filters existing articles in the database and removes those
that don't meet technical content criteria.
"""

import argparse
import os
import sys

from dotenv import load_dotenv

from article_filter import batch_filter_articles
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


def get_all_articles(conn):
    """Get all articles from database."""
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, title, summary, original_url, source_name, created_at
        FROM articles
        WHERE deleted = 0
        ORDER BY created_at DESC
    """
    )

    articles = []
    for row in cursor.fetchall():
        articles.append(
            {
                "id": row[0],
                "title": row[1],
                "content": row[2],  # Using summary as content for filtering
                "original_url": row[2],
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

    args = parser.parse_args()

    # Check LLM configuration
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
        # Get all articles
        print("📋 Loading articles from database...")
        all_articles = get_all_articles(conn)

        if not all_articles:
            print("ℹ️  No articles found in database.")
            return 0

        # Apply filters
        articles_to_process = all_articles

        if args.source:
            articles_to_process = [a for a in articles_to_process if a["source_name"] == args.source]
            print(f"🔍 Filtering by source: {args.source}")

        if args.limit:
            articles_to_process = articles_to_process[: args.limit]
            print(f"🔢 Limited to {args.limit} articles for processing")

        total_articles = len(articles_to_process)
        print(f"📊 Total articles to process: {total_articles}")

        if total_articles == 0:
            print("ℹ️  No articles match the specified criteria.")
            return 0

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

        print("\n🚀 Starting LLM-based article filtering...")
        print(f"   Mode: {'DRY RUN' if args.dry_run else 'LIVE DELETION'}")

        # Batch filter articles
        accepted, rejected = batch_filter_articles(
            articles_to_process, LLM_CONFIG, batch_size=args.batch_size
        )

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
            print("\n🎉 All articles passed the filter! No deletions needed.")

        return 0

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
