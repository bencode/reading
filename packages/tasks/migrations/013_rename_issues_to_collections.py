"""
Rename issues table to collections

Revision ID: 013
Revises: 012
Create Date: 2024-01-15

"""

def apply_step(conn):
    """Rename issues table to collections and issue_sections to collection_sections"""
    # Rename main table
    conn.execute("ALTER TABLE issues RENAME TO collections")
    
    # Rename sections table  
    conn.execute("ALTER TABLE issue_sections RENAME TO collection_sections")
    
    # Update foreign key column name in sections table
    conn.execute("ALTER TABLE collection_sections RENAME COLUMN issue_id TO collection_id")

def rollback_step(conn):
    """Rollback the rename operation"""
    # Rename back
    conn.execute("ALTER TABLE collections RENAME TO issues")
    conn.execute("ALTER TABLE collection_sections RENAME TO issue_sections") 
    conn.execute("ALTER TABLE issue_sections RENAME COLUMN collection_id TO issue_id")