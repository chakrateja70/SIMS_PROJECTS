import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


class GroqService:

    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model  = "meta-llama/llama-4-scout-17b-16e-instruct"

    def _chat(self, prompt: str) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )
        return response.choices[0].message.content.strip()

    def _parse_json(self, raw: str) -> dict:
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())

    def extract_receipt_data(self, ocr_text: str) -> dict:
        prompt = f"""
You are extracting structured data from a DMart receipt.
The text below was extracted via OCR. It may contain tables, special characters,
currency symbols (Rs. or rupee symbol), dashes, colons, and multi-column item rows.

Extract exactly these fields and return ONLY valid JSON:

{{
  "customer_name" : "full name of the customer",
  "mobile"        : "10-digit mobile number as string",
  "order_date"    : "DD/MM/YYYY",
  "delivery_date" : "DD/MM/YYYY",
  "payment_mode"  : "UPI / Cash / Card / Net Banking etc.",
  "total_items"   : <integer — total number of distinct items>,
  "items"         : [
    {{
      "name"   : "product name",
      "qty"    : <integer>,
      "rate"   : <float — price per unit>,
      "amount" : <float — qty x rate>
    }}
  ],
  "total_amount"  : <float — final payable amount>
}}

Rules:
- Read every line carefully including all table rows.
- Parse ALL rows in the items/product table, do not skip any.
- If a field is not found, set its value to null.
- Do not guess or make up values not present in the text.
- Return ONLY the JSON object. No explanation, no extra text.

OCR text:
{ocr_text}
"""
        raw = self._chat(prompt)
        return self._parse_json(raw)

    def get_spending_insights(self, receipts: list) -> str:
        if not receipts:
            return "No receipts found to analyse."

        summary = json.dumps(
            [r["data"] for r in receipts if r.get("data")],
            indent=2
        )
        prompt = f"""
Analyse these DMart receipts and give a clear spending summary:
- Total amount spent across all receipts
- Most frequently bought items
- Average order value
- Payment mode breakdown
- Any spending trends

Receipt data:
{summary}

Give a clean, readable summary. No JSON needed.
"""
        return self._chat(prompt)
