from yoyo import step

def apply_step(conn):
    cursor = conn.cursor()
    categories = [
        "综合与必读",
        "编程语言与函数式编程",
        "前端、Web开发",
        "深度学习、LLM 与 AI 进展",
        "Other"
    ]
    for category in categories:
        try:
            cursor.execute("INSERT INTO categories (name) VALUES (?) ON CONFLICT(name) DO NOTHING", (category,))
            print(f"Inserted category: {category}")
        except Exception as e:
            print(f"Error inserting category {category}: {e}")
    conn.commit()

def rollback_step(conn):
    cursor = conn.cursor()
    categories = [
        "综合与必读",
        "编程语言与函数式编程",
        "前端、Web开发",
        "深度学习、LLM 与 AI 进展",
        "Other"
    ]
    for category in categories:
        try:
            cursor.execute("DELETE FROM categories WHERE name = ?", (category,))
            print(f"Deleted category: {category}")
        except Exception as e:
            print(f"Error deleting category {category}: {e}")
    conn.commit()

steps = [
    step(apply_step, rollback_step)
]
