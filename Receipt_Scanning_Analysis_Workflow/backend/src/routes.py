from fastapi import APIRouter, UploadFile, File, HTTPException
from src.services.ocr_service import OCRService
from src.services.groq_service import GroqService
from src.db.models import save_receipt, get_all_receipts, get_receipts_by_mobile, delete_receipt_by_id
router = APIRouter()
ocr  = OCRService()
groq = GroqService()


# ── POST /upload ──────────────────────────────────────────────────────────────

@router.post("/upload", summary="Upload a DMart receipt image")
async def upload_receipt(file: UploadFile = File(...)):
    allowed_content_types = {"image/jpeg", "image/jpg", "image/png", "application/pdf"}
    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG, PNG, or PDF files are supported",
        )

    # 1. OCR — extract full text from image (tables, special chars, all content)
    image_bytes = await file.read()
    ocr_text    = ocr.extract_text(image_bytes, content_type=file.content_type, filename=file.filename)

    # 2. LLM — extract all fields from OCR text and return structured JSON
    extracted   = groq.extract_receipt_data(ocr_text)

    # 3. Save to Neon DB
    receipt_id  = save_receipt(ocr_text, extracted, "ocr+llm")

    return {
        "id"          : receipt_id,
        "extracted_by": "ocr+llm",
        "data"        : extracted
    }


# ── GET /receipts ─────────────────────────────────────────────────────────────

@router.get("/receipts", summary="List all uploaded receipts")
def list_receipts():
    return get_all_receipts()


# ── GET /receipts/{mobile} ────────────────────────────────────────────────────

@router.get("/receipts/{mobile}", summary="Get receipts by user mobile number")
def get_receipts_for_mobile(mobile: str):
    receipts = get_receipts_by_mobile(mobile)
    if not receipts:
        raise HTTPException(status_code=404, detail="No receipts found for this mobile number")
    return receipts


# ── DELETE /receipts/{receipt_id} ───────────────────────────────────────────

@router.delete("/receipts/{receipt_id}", summary="Delete a receipt by id")
def delete_receipt(receipt_id: int):
    deleted = delete_receipt_by_id(receipt_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return {"ok": True, "message": "Receipt deleted"}


# ── GET /insights ─────────────────────────────────────────────────────────────

@router.get("/insights", summary="Spending insights across all receipts")
def spending_insights():
    receipts = get_all_receipts()
    insights = groq.get_spending_insights(receipts)
    return {"insights": insights}
