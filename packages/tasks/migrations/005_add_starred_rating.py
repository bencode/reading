from yoyo import step

def apply_step(conn):
    cursor = conn.cursor()
    
    # Add starred column (boolean, default false)
    cursor.execute('''
    ALTER TABLE articles ADD COLUMN starred BOOLEAN DEFAULT FALSE;
    ''')
    
    # Add rating column (integer, 0-5 scale, default null)
    cursor.execute('''
    ALTER TABLE articles ADD COLUMN rating INTEGER DEFAULT NULL CHECK(rating IS NULL OR (rating >= 0 AND rating <= 5));
    ''')
    
    conn.commit()

def rollback_step(conn):
    cursor = conn.cursor()
    
    # SQLite doesn't support DROP COLUMN, so we need to recreate the table
    # This is a simplified rollback - in production you'd want to preserve data
    cursor.execute('''
    CREATE TABLE articles_backup AS SELECT 
        id, title, original_url, summary, source_name, 
        published_at, created_at, is_read, category_id
    FROM articles;
    ''')
    
    cursor.execute('DROP TABLE articles;')
    
    cursor.execute('''
    CREATE TABLE articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        original_url TEXT NOT NULL UNIQUE,
        summary TEXT NOT NULL,
        source_name VARCHAR(100),
        published_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT FALSE,
        category_id INTEGER,
        FOREIGN KEY (category_id) REFERENCES categories(id)
    );
    ''')
    
    cursor.execute('''
    INSERT INTO articles (id, title, original_url, summary, source_name, published_at, created_at, is_read, category_id)
    SELECT id, title, original_url, summary, source_name, published_at, created_at, is_read, category_id
    FROM articles_backup;
    ''')
    
    cursor.execute('DROP TABLE articles_backup;')
    
    conn.commit()

steps = [
    step(apply_step, rollback_step)
]