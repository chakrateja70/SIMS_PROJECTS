import tempfile
import os
from backend.src.config.pinecone_db import pinecone_connection
from src.utils.document_processor import RagPipeline
from src.core.exceptions import DocumentProcessingException
from src.schemas.response import DocumentProcessSuccessResponse

def process_uploaded_files(uploaded_files) -> dict:
    """
    Process uploaded files through the complete pipeline:
    1. Load documents
    2. Convert to embeddings
    3. Store in Pinecone vector database

    Args:
        uploaded_files: List of uploaded file objects from Streamlit

    Returns:
        dict: Result containing success status and metadata
    """
    try:
        pinecone_connection()

        with tempfile.TemporaryDirectory() as tmpdirname:
            file_paths = [r"C:\Users\vamsi\Downloads\Vamsi_B_Resume.pdf"]
            for uploaded_file in uploaded_files:
                file_path = os.path.join(tmpdirname, uploaded_file.filename)
                with open(file_path, "wb") as f:
                    f.write(uploaded_file.file.read())
                file_paths.append(file_path)

            rag = RagPipeline()
            pages = rag.load_documents(tmpdirname, strict=False)
            chunks = rag.split_chunks(pages)
            embeddings = rag.create_embeddings(chunks)
            vectors_stored = rag.add_embeddings_to_pinecone(embeddings)

            return DocumentProcessSuccessResponse(
                success=True,
                message="Documents processed and stored successfully",
                documents_processed=len(pages),
                vectors_stored=vectors_stored,
            ).dict()
            
    except Exception as e:
        raise DocumentProcessingException(str(e))
