import json
from src.db.database import get_connection


def save_receipt(raw_text: str, extracted: dict, extracted_by: str) -> int:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO receipts (raw_text, extracted, extracted_by)
        VALUES (%s, %s, %s)
        RETURNING id
        """,
        (raw_text, json.dumps(extracted), extracted_by)
    )
    row = cur.fetchone()
    if row is None:
        conn.rollback()
        cur.close()
        conn.close()
        raise RuntimeError("Failed to save receipt")
    receipt_id = row[0]
    conn.commit()
    cur.close()
    conn.close()
    return receipt_id


def get_all_receipts() -> list:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, extracted, extracted_by, uploaded_at FROM receipts ORDER BY uploaded_at DESC"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {
            "id": r[0],
            "data": r[1],
            "extracted_by": r[2],
            "uploaded_at": str(r[3])
        }
        for r in rows
    ]


def get_receipts_by_mobile(mobile: str) -> list:
    digits = "".join(ch for ch in mobile if ch.isdigit())
    if not digits:
        return []

    # Support both exact digit match and country-code prefixed values (e.g., +91XXXXXXXXXX).
    last_10_digits = digits[-10:]

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, extracted, extracted_by, uploaded_at
        FROM receipts
        WHERE regexp_replace(COALESCE(extracted->>'mobile', ''), '\\D', '', 'g') = %s
           OR RIGHT(regexp_replace(COALESCE(extracted->>'mobile', ''), '\\D', '', 'g'), 10) = %s
        ORDER BY uploaded_at DESC
        """,
        (digits, last_10_digits)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "id": r[0],
            "data": r[1],
            "extracted_by": r[2],
            "uploaded_at": str(r[3])
        }
        for r in rows
    ]


def delete_receipt_by_id(receipt_id: int) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM receipts WHERE id = %s", (receipt_id,))
    deleted = cur.rowcount > 0
    conn.commit()
    cur.close()
    conn.close()
    return deleted