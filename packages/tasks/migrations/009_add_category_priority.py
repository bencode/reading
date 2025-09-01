from yoyo import step

# Category priorities based on RSS configuration
CATEGORY_PRIORITIES = {
    "AI 研究与论文速览": 1,
    "深度学习与 LLM 工程": 2,
    "数据库与数据工程": 3,
    "云原生与运维平台": 4,
    "Web 开发工具与性能": 5,
    "JavaScript / TypeScript / Node.js": 6,
    "Rust 与系统工程": 7,
    "前端与 Web 平台": 8,
    "Python 生态": 9,
    "函数式与 Lisp/Clojure 家族": 10,
    "人物与思想 / 架构与文化": 11,
    "精选与综合": 12,
    "Other": 13,
}

def apply_step(conn):
    cursor = conn.cursor()
    
    # Add priority column to categories table
    cursor.execute("ALTER TABLE categories ADD COLUMN priority INTEGER DEFAULT 999")
    
    # Update priorities for existing categories
    for category_name, priority in CATEGORY_PRIORITIES.items():
        cursor.execute(
            "UPDATE categories SET priority = ? WHERE name = ?", 
            (priority, category_name)
        )
    
    # Add "Web 开发工具与性能" category if it doesn't exist
    cursor.execute("SELECT COUNT(*) FROM categories WHERE name = ?", ("Web 开发工具与性能",))
    if cursor.fetchone()[0] == 0:
        cursor.execute(
            "INSERT INTO categories (name, priority) VALUES (?, ?)", 
            ("Web 开发工具与性能", 5)
        )
    
    conn.commit()
    print("✓ Added priority column to categories and updated priorities")

def rollback_step(conn):
    cursor = conn.cursor()
    
    # Remove the priority column
    # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
    cursor.execute("CREATE TABLE categories_backup AS SELECT id, name FROM categories")
    cursor.execute("DROP TABLE categories")
    cursor.execute("CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)")
    cursor.execute("INSERT INTO categories (id, name) SELECT id, name FROM categories_backup")
    cursor.execute("DROP TABLE categories_backup")
    
    conn.commit()
    print("✓ Removed priority column from categories")

steps = [
    step(apply_step, rollback_step)
]