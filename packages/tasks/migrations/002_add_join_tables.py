from yoyo import step

def apply_step(conn):
    cursor = conn.cursor()
    # Add article_categories join table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS article_categories (
        article_id INTEGER,
        category_id INTEGER,
        PRIMARY KEY (article_id, category_id),
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
    ''')

    # Add article_tags join table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS article_tags (
        article_id INTEGER,
        tag_id INTEGER,
        PRIMARY KEY (article_id, tag_id),
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
    ''')
    conn.commit()

def rollback_step(conn):
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS article_categories;")
    cursor.execute("DROP TABLE IF EXISTS article_tags;")
    conn.commit()

steps = [
    step(apply_step, rollback_step)
]
