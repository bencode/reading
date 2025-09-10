from yoyo import step


def apply_step(conn):
    cursor = conn.cursor()
    
    # Create issues table
    cursor.execute('''
    CREATE TABLE issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        cover_image TEXT,
        status VARCHAR(20) DEFAULT 'draft',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        published_at TEXT DEFAULT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    ''')
    
    # Create issue_sections table
    cursor.execute('''
    CREATE TABLE issue_sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_id INTEGER NOT NULL,
        article_id INTEGER NOT NULL,
        title VARCHAR(255),
        description TEXT,
        image TEXT,
        external_url TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );
    ''')
    
    # Create indexes for better query performance
    cursor.execute('''
    CREATE INDEX idx_issue_sections_issue_id ON issue_sections(issue_id);
    ''')
    
    cursor.execute('''
    CREATE INDEX idx_issue_sections_article_id ON issue_sections(article_id);
    ''')
    
    cursor.execute('''
    CREATE INDEX idx_issue_sections_order ON issue_sections(issue_id, order_index);
    ''')
    
    conn.commit()
    print("✓ Created issues and issue_sections tables with indexes")


def rollback_step(conn):
    cursor = conn.cursor()
    
    cursor.execute("DROP INDEX IF EXISTS idx_issue_sections_order;")
    cursor.execute("DROP INDEX IF EXISTS idx_issue_sections_article_id;")
    cursor.execute("DROP INDEX IF EXISTS idx_issue_sections_issue_id;")
    cursor.execute("DROP TABLE IF EXISTS issue_sections;")
    cursor.execute("DROP TABLE IF EXISTS issues;")
    
    conn.commit()
    print("✓ Dropped issues and issue_sections tables")


steps = [
    step(apply_step, rollback_step)
]