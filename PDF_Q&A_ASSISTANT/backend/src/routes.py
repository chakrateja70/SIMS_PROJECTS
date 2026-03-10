import os
import fitz
import tempfile
from fastapi import APIRouter, UploadFile, File, Form
from src.schemas.response import QueryRequest
from src.utils.swagger import uploadendpoint, queryendpoint
from src.db.upload import process_uploaded_files
from src.services.rag_service import get_rag_response
from src.services.summarize_service import get_summary
from pathlib import Path
from src.core.exceptions import LLMServiceAPIException, LLMServiceUnexpectedException


router = APIRouter()

# --- File Upload Endpoint ---
@router.post("/upload", **uploadendpoint)
async def upload_files(uploaded_files: list[UploadFile] = File(...)):
    """
    Upload and process files, returning processing result.
    """
    result = process_uploaded_files(uploaded_files)
    return result

# --- Query Endpoint ---
@router.post("/query", **queryendpoint)
async def query_rag_service(request: QueryRequest):
    """
    Query the RAG service and return the response.
    """
    response = get_rag_response(
        query=request.query,
        top_k=request.top_k,
        min_score=request.min_score
    )
    return response


# --- Summarize Endpoint ---
@router.post("/summarize")
async def summarize_document(
    file: UploadFile | None = File(default=None),
    text: str | None = Form(default=None),
    style: str = Form(default="detailed"),
    llm: str = Form(default="groq"),
):
    """
    Summarize an uploaded file (PDF/TXT/DOCX) or plain text.
    style: 'short' | 'detailed' | 'bullets'
    llm:   'groq' | 'groq'
    """


    raw_text = ""

    try:
        if file and file.filename:
            ext = Path(file.filename).suffix.lower()
            contents = await file.read()
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                tmp.write(contents)
                tmp_path = tmp.name
            try:
                if ext == ".pdf":
                    with fitz.open(tmp_path) as doc:
                        raw_text = "\n".join(
                            page.get_text("text") for page in doc
                        ).strip()
                elif ext == ".txt":
                    raw_text = contents.decode("utf-8", errors="ignore").strip()
                elif ext == ".docx":
                    from docx import Document as DocxDocument
                    doc = DocxDocument(tmp_path)
                    raw_text = "\n".join(
                        p.text for p in doc.paragraphs if p.text.strip()
                    )
                else:
                    return {"error": f"Unsupported file type: {ext}"}
            finally:
                os.unlink(tmp_path)

        elif text:
            raw_text = text.strip()

        if not raw_text:
            return {"error": "No content provided. Upload a file or supply text."}

        summary = get_summary(text=raw_text, style=style, llm=llm)
        return {
            "summary": summary,
            "filename": file.filename if file and file.filename else "text input",
            "word_count": len(raw_text.split()),
        }

    except (LLMServiceAPIException, LLMServiceUnexpectedException) as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": str(e)}
