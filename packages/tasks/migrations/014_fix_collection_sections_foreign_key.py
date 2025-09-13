"""
Fix collection_sections foreign key reference from issues to collections
"""

from yoyo import step

__depends__ = {"013_rename_issues_to_collections"}

steps = [
    step("""
        -- Create new collection_sections table with correct foreign key
        CREATE TABLE collection_sections_new (
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
    
    step("""
        -- Copy data from old table to new table
        INSERT INTO collection_sections_new 
        SELECT * FROM collection_sections;
    """),
    
    step("""
        -- Drop old table
        DROP TABLE collection_sections;
    """),
    
    step("""
        -- Rename new table to correct name
        ALTER TABLE collection_sections_new RENAME TO collection_sections;
    """),
    
    step("""
        -- Recreate indexes
        CREATE INDEX idx_collection_sections_collection_id ON collection_sections(collection_id);
    """),
    
    step("""
        CREATE INDEX idx_collection_sections_article_id ON collection_sections(article_id);
    """),
    
    step("""
        CREATE INDEX idx_collection_sections_order ON collection_sections(collection_id, order_index);
    """)
]