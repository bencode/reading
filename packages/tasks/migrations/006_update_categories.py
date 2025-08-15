from yoyo import step

# New categories based on the comprehensive classification system
NEW_CATEGORIES = [
    "精选与综合",
    "前端与 Web 平台", 
    "JavaScript / TypeScript / Node.js",
    "Python 生态",
    "Rust 与系统工程",
    "函数式与 Lisp/Clojure 家族",
    "数据库与数据工程",
    "云原生与运维平台",
    "深度学习与 LLM 工程",
    "AI 研究与论文速览",
    "人物与思想 / 架构与文化",
    "Other",
]

def apply_step(conn):
    cursor = conn.cursor()
    
    # Clear existing categories (keep article_categories relationships intact)
    cursor.execute("DELETE FROM categories")
    
    # Insert new categories
    for category in NEW_CATEGORIES:
        cursor.execute("INSERT INTO categories (name) VALUES (?)", (category,))
    
    conn.commit()
    print(f"✓ Updated categories with {len(NEW_CATEGORIES)} new categories")

def rollback_step(conn):
    cursor = conn.cursor()
    
    # Restore original basic categories
    cursor.execute("DELETE FROM categories")
    
    original_categories = [
        "综合与必读",
        "编程语言与函数式编程", 
        "前端、Web开发",
        "深度学习、LLM 与 AI 进展",
        "Other"
    ]
    
    for category in original_categories:
        cursor.execute("INSERT INTO categories (name) VALUES (?)", (category,))
    
    conn.commit()
    print(f"✓ Rolled back to {len(original_categories)} original categories")

steps = [
    step(apply_step, rollback_step)
]