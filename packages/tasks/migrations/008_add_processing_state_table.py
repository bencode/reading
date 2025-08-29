"""Add article processing state tracking table"""

from yoyo import step

steps = [
    step(
        """
        CREATE TABLE IF NOT EXISTS article_processing_state (
            article_id INTEGER PRIMARY KEY,
            processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            filter_result TEXT,  -- 'accepted' or 'rejected'  
            filter_reason TEXT,
            FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE
        )
        """,
        """
        DROP TABLE IF EXISTS article_processing_state
        """
    ),
    
    # Add index for faster queries
    step(
        """
        CREATE INDEX IF NOT EXISTS idx_processing_state_result 
        ON article_processing_state (filter_result)
        """,
        """
        DROP INDEX IF EXISTS idx_processing_state_result
        """
    ),
    
    step(
        """
        CREATE INDEX IF NOT EXISTS idx_processing_state_processed_at 
        ON article_processing_state (processed_at)
        """,
        """
        DROP INDEX IF EXISTS idx_processing_state_processed_at
        """
    )
]