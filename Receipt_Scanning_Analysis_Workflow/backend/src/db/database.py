import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()

def get_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

def init_db():
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS receipts (
            id          SERIAL PRIMARY KEY,
            raw_text    TEXT,
            extracted   JSONB,
            extracted_by TEXT,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # index on mobile inside JSONB for fast lookup by mobile number
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_receipt_mobile
        ON receipts ((extracted->>'mobile'))
    """)
    conn.commit()
    cur.close()
    conn.close()
    print("Database initialised.")
