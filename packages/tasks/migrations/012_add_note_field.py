from yoyo import step

def apply_step(conn):
    cursor = conn.cursor()
    
    # Add note column to articles table
    cursor.execute("""
        ALTER TABLE articles 
        ADD COLUMN note TEXT
    """)
    
    print("✓ Added note column to articles table")
    
    conn.commit()

def rollback_step(conn):
    cursor = conn.cursor()
    
    # Remove note column from articles table
    cursor.execute("""
        ALTER TABLE articles 
        DROP COLUMN note
    """)
    
    print("✓ Removed note column from articles table")
    
    conn.commit()

steps = [
    step(apply_step, rollback_step)
]