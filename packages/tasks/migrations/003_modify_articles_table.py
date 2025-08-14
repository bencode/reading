from yoyo import step

def apply_step(conn):
    cursor = conn.cursor()

    # Check if 'tags' column exists and 'category_id' does not
    cursor.execute("PRAGMA table_info(articles);")
    columns = [col[1] for col in cursor.fetchall()]

    if 'tags' in columns and 'category_id' not in columns:
        print("Migrating 'articles' table schema: removing 'tags' column, adding 'category_id'.")
        cursor.execute('''
        CREATE TABLE articles_new (
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
        INSERT INTO articles_new (id, title, original_url, summary, source_name, published_at, created_at, is_read)
        SELECT id, title, original_url, summary, source_name, published_at, created_at, is_read
        FROM articles;
        ''')
        cursor.execute("DROP TABLE articles;")
        cursor.execute("ALTER TABLE articles_new RENAME TO articles;")
        print("Table 'articles' schema migrated successfully.")
    elif 'category_id' in columns:
        print("Table 'articles' already has 'category_id' column. Skipping migration for 'articles' table.")
    else:
        print("Table 'articles' does not have 'tags' column or 'category_id' column. Assuming initial setup or already migrated.")

    conn.commit()

def rollback_step(conn):
    cursor = conn.cursor()
    # This rollback is complex due to SQLite's ALTER TABLE limitations.
    # For simplicity in this example, we'll assume a full rollback of this specific step
    # would involve recreating the original table and re-inserting data, which is out of scope for a simple rollback.
    # In a real-world scenario, you'd need to carefully manage data loss on rollback.
    print("Rollback for 003_modify_articles_table.py is not fully implemented due to SQLite ALTER TABLE limitations.")
    print("Manual intervention might be required if you need to revert this specific migration.")

steps = [
    step(apply_step, rollback_step)
]
