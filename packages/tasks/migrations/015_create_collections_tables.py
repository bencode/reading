"""
Create collections and collection_sections tables and migrate data from issues tables

Revision ID: 015
Revises: 012
Create Date: 2024-09-14
"""

from yoyo import step

__depends__ = {"012_create_issues_tables"}

def migrate_issues_data(conn):
    """Safely migrate data from issues table if it exists"""
    cursor = conn.cursor()
    
    # Check if issues table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='issues'")
    if cursor.fetchone():
        # Migrate data from issues to collections
        cursor.execute("""
            INSERT OR IGNORE INTO collections (id, title, description, cover_image, status, created_at, published_at, updated_at)
            SELECT id, title, description, cover_image, status, created_at, published_at, updated_at 
            FROM issues
        """)

def migrate_issue_sections_data(conn):
    """Safely migrate data from issue_sections table if it exists"""
    cursor = conn.cursor()
    
    # Check if issue_sections table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='issue_sections'")
    if cursor.fetchone():
        # Migrate data from issue_sections to collection_sections
        # Note: issue_sections.issue_id maps to collection_sections.collection_id
        cursor.execute("""
            INSERT OR IGNORE INTO collection_sections (id, collection_id, article_id, title, description, image, external_url, order_index, created_at)
            SELECT id, issue_id, article_id, title, description, image, external_url, order_index, created_at 
            FROM issue_sections
        """)

steps = [
    step("""
        -- 创建collections表（如果不存在）
        CREATE TABLE IF NOT EXISTS collections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            cover_image TEXT,
            status VARCHAR(20) DEFAULT 'draft',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            published_at TEXT,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    """),
    
    step(migrate_issues_data),
    
    step("""
        -- 创建collection_sections表（如果不存在）
        CREATE TABLE IF NOT EXISTS collection_sections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            collection_id INTEGER NOT NULL,
            article_id INTEGER NOT NULL,
            title VARCHAR(255),
            description TEXT,
            image TEXT,
            external_url TEXT,
            order_index INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
            FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
        );
    """),
    
    step(migrate_issue_sections_data),
    
    step("""
        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_collection_sections_collection_id ON collection_sections(collection_id);
    """),
    
    step("""
        CREATE INDEX IF NOT EXISTS idx_collection_sections_article_id ON collection_sections(article_id);
    """),
    
    step("""
        CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);
    """),
    
    step("""
        -- 删除旧的issues表（如果存在）
        DROP TABLE IF EXISTS issues;
    """),
    
    step("""
        -- 删除旧的issue_sections表（如果存在）  
        DROP TABLE IF EXISTS issue_sections;
    """)
]