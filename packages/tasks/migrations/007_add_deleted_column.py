from yoyo import step

def apply_step(conn):
    cursor = conn.cursor()
    
    # Add deleted column (boolean, default false)
    cursor.execute('''
    ALTER TABLE articles ADD COLUMN deleted BOOLEAN DEFAULT FALSE;
    ''')
    
    conn.commit()
    print("✓ Added deleted column to articles table")

def rollback_step(conn):
    cursor = conn.cursor()
    
    # SQLite doesn't support DROP COLUMN directly, but we can ignore this for now
    # since this is a simple addition that won't break existing functionality
    print("⚠ SQLite doesn't support DROP COLUMN - deleted column will remain")
    
    conn.commit()

steps = [
    step(apply_step, rollback_step)
]