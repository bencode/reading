from yoyo import step

def apply_step(conn):
    cursor = conn.cursor()
    
    # Get the Technology category ID
    cursor.execute("SELECT id FROM categories WHERE name = ?", ("Technology",))
    result = cursor.fetchone()
    
    if result:
        category_id = result[0]
        
        # Get all article IDs in Technology category
        cursor.execute("SELECT article_id FROM article_categories WHERE category_id = ?", (category_id,))
        article_ids = [row[0] for row in cursor.fetchall()]
        
        print(f"Found {len(article_ids)} articles in Technology category")
        
        if article_ids:
            # Delete article_categories relationships
            cursor.execute("DELETE FROM article_categories WHERE category_id = ?", (category_id,))
            
            # Delete article_tags relationships for these articles
            placeholders = ','.join('?' * len(article_ids))
            cursor.execute(f"DELETE FROM article_tags WHERE article_id IN ({placeholders})", article_ids)
            
            # Delete the articles themselves
            cursor.execute(f"DELETE FROM articles WHERE id IN ({placeholders})", article_ids)
            
            print(f"✓ Deleted {len(article_ids)} articles and their relationships")
        
        # Delete the Technology category
        cursor.execute("DELETE FROM categories WHERE id = ?", (category_id,))
        print("✓ Deleted Technology category")
    else:
        print("Technology category not found, nothing to delete")
    
    conn.commit()

def rollback_step(conn):
    cursor = conn.cursor()
    
    # Recreate Technology category with default priority
    cursor.execute("INSERT INTO categories (name, priority) VALUES (?, ?)", ("Technology", 999))
    print("✓ Recreated Technology category (articles cannot be restored)")
    
    conn.commit()

steps = [
    step(apply_step, rollback_step)
]