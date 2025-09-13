from yoyo import step

def apply_step(conn):
    cursor = conn.cursor()
    
    # Add skip column to articles table
    cursor.execute("""
        ALTER TABLE articles 
        ADD COLUMN is_skipped BOOLEAN DEFAULT FALSE
    """)
    
    print("✓ Added is_skipped column to articles table")
    
    conn.commit()

def rollback_step(conn):
    cursor = conn.cursor()
    
    # Remove skip column from articles table
    cursor.execute("""
        ALTER TABLE articles 
        DROP COLUMN is_skipped
    """)
    
    print("✓ Removed is_skipped column from articles table")
    
    conn.commit()

steps = [
    step(apply_step, rollback_step)
]