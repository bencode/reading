from yoyo import step


def apply_step(conn):
    cursor = conn.cursor()
    
    # Check if 'read_at' column already exists
    cursor.execute("PRAGMA table_info(articles);")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'read_at' not in columns:
        print("Adding 'read_at' timestamp column to articles table.")
        cursor.execute('''
            ALTER TABLE articles ADD COLUMN read_at TEXT DEFAULT NULL;
        ''')
        print("Column 'read_at' added successfully.")
    else:
        print("Column 'read_at' already exists. Skipping migration.")
    
    conn.commit()


def rollback_step(conn):
    cursor = conn.cursor()
    print("Note: SQLite does not support DROP COLUMN. Manual rollback required if needed.")
    

steps = [
    step(apply_step, rollback_step)
]