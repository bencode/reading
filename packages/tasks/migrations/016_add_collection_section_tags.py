"""
Add collection_section_tags table to support tags for collection sections

Revision ID: 016
Revises: 015
Create Date: 2024-09-19
"""

from yoyo import step

__depends__ = {"015_create_collections_tables"}

def apply_step(conn):
    cursor = conn.cursor()

    # Create collection_section_tags join table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS collection_section_tags (
        collection_section_id INTEGER,
        tag_id INTEGER,
        PRIMARY KEY (collection_section_id, tag_id),
        FOREIGN KEY (collection_section_id) REFERENCES collection_sections(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
    ''')

    # Create index for better query performance
    cursor.execute('''
    CREATE INDEX IF NOT EXISTS idx_collection_section_tags_section_id
    ON collection_section_tags(collection_section_id);
    ''')

    cursor.execute('''
    CREATE INDEX IF NOT EXISTS idx_collection_section_tags_tag_id
    ON collection_section_tags(tag_id);
    ''')

    conn.commit()

def rollback_step(conn):
    cursor = conn.cursor()
    cursor.execute("DROP INDEX IF EXISTS idx_collection_section_tags_section_id;")
    cursor.execute("DROP INDEX IF EXISTS idx_collection_section_tags_tag_id;")
    cursor.execute("DROP TABLE IF EXISTS collection_section_tags;")
    conn.commit()

steps = [
    step(apply_step, rollback_step)
]