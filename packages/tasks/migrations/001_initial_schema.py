from yoyo import step
import os
import sqlite3

DB_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
DB_PATH = os.path.join(DB_DIR, 'reading.db')

def apply_step(conn):
    cursor = conn.cursor()
    # Ensure articles table exists with its original schema (if not already created by scraper.py)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        original_url TEXT NOT NULL UNIQUE,
        summary TEXT NOT NULL,
        source_name VARCHAR(100),
        published_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT FALSE,
        tags VARCHAR(255) -- This will be removed in a later migration
    );
    ''')

    # Create categories table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    );
    ''')

    # Create tags table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    );
    ''')
    conn.commit()

def rollback_step(conn):
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS categories;")
    cursor.execute("DROP TABLE IF EXISTS tags;")
    # Note: We don't drop articles table here as it might contain existing data
    conn.commit()

steps = [
    step(apply_step, rollback_step)
]
