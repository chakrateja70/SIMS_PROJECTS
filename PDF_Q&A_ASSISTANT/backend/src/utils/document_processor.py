import fitz  # PyMuPDF
import uuid
from pathlib import Path
from typing import List, Dict, Any
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from src.config import settings
from src.core.exceptions import (
    DocumentFolderNotFoundException,
    DocumentProcessingException,
    NoChunksToEmbedException,
    EmbeddingModelException,
    PineconeQueryException,
    PineconeUpsertException
)
from pdf2image import convert_from_path
from pdf2image.exceptions import PDFInfoNotInstalledError
import pytesseract
from langchain_community.document_loaders.image import UnstructuredImageLoader

pinecone_namespace = settings.PINECONE_NAMESPACE 
pinecone_index_name = settings.PINECONE_INDEX_NAME 
pinecone_api_key = settings.PINECONE_API_KEY
PINECONE_BATCH_SIZE = int(settings.PINECONE_BATCH_SIZE) if settings.PINECONE_BATCH_SIZE else 100


class RagPipeline:
    _embedding_model = None  # Class-level cache
    
    def __init__(self):
        print("Initializing RagPipeline...")
        # Use cached model if available
        if RagPipeline._embedding_model is None:
            print("Loading embedding model for the first time...")
            RagPipeline._embedding_model = SentenceTransformer('intfloat/e5-base-v2')
        else:
            print("Using cached embedding model")
        
        self.embedding_model = RagPipeline._embedding_model
        
        # Initialize Pinecone
        pc = Pinecone(api_key=pinecone_api_key)
        self.index = pc.Index(pinecone_index_name)
        
        print("RagPipeline initialized successfully")

    def load_documents(self, folder_path: str, strict: bool = True) -> List[Dict[str, Any]]:
        """
        Load PDF documents from a folder.

        Args:
            folder_path (str): Path to folder containing PDF documents.
            strict (bool): If True, raises exceptions on errors; otherwise, logs and skips bad files.

        Returns:
            List[Dict[str, Any]]: List of document entries with page content.
        """
        print(f"Loading documents from folder: {folder_path}")
        folder = Path(folder_path)
        if not folder.is_dir():
            raise DocumentFolderNotFoundException(folder_path)

        pages = []

        for file in folder.rglob("*.pdf"):
            print(f"Processing file: {file.name}")
            try:
                with fitz.open(file) as doc:
                    for page_idx, page in enumerate(doc):
                        text = page.get_text("text").strip()
                        if not text:
                            # OCR fallback for image-only pages
                            try:
                                images = convert_from_path(
                                    str(file),
                                    first_page=page_idx + 1,
                                    last_page=page_idx + 1,
                                    poppler_path=POPPLER_PATH,
                                )
                            except PDFInfoNotInstalledError as e:
                                raise DocumentProcessingException(
                                    "Poppler is required for OCR. Install Poppler and set POPPLER_PATH to its bin directory."
                                ) from e
                            if images:
                                text = pytesseract.image_to_string(images[0]).strip()
                        if not text:
                            continue
                        pages.append({
                            "page_content": text,
                            "filename": file.name,
                            "page_number": page_idx + 1,
                            "file_path": str(file)
                        })
            except Exception as e:
                msg = f"Error reading {file.name}: {e}"
                if strict:
                    raise
                print(msg)
                continue
        if not pages and strict:
            raise DocumentFolderNotFoundException(f"No readable PDF pages in {folder_path}")
        print(f"Loaded {len(pages)} pages from {len(list(folder.rglob('*.pdf')))} PDF files")
        return pages

    def load_images(self, folder_path: str, strict: bool = True) -> List[Dict[str, Any]]:
        """Load text from image files using Unstructured."""
        folder = Path(folder_path)
        if not folder.is_dir():
            raise DocumentFolderNotFoundException(folder_path)
        pages = []
        for img in folder.rglob("*"):
            if img.suffix.lower() not in {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp"}:
                continue
            try:
                loader = UnstructuredImageLoader(str(img), mode="elements")
                docs = loader.load()
                for d in docs:
                    text = (d.page_content or "").strip()
                    if not text:
                        continue
                    pages.append({
                        "page_content": text,
                        "filename": img.name,
                        "page_number": d.metadata.get("page_number", 1),
                        "file_path": str(img),
                        "category": d.metadata.get("category")
                    })
            except Exception as e:
                if strict:
                    raise
                print(f"Error reading {img.name}: {e}")
        return pages

    def split_chunks(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Split PDF pages into smaller chunks.
        
        Args:
            pages: List of page dictionaries with 'page_content'
            
        Returns:
            List of chunk dictionaries with text and metadata
        """
        print(f"Splitting {len(pages)} pages into chunks...")
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            is_separator_regex=False,
        )
        chunks = []
        for doc in pages:
            if not doc.get("page_content") or not doc["page_content"].strip():
                continue
            
            split_docs = text_splitter.create_documents(
                [doc["page_content"]], 
                metadatas=[{
                    "filename": doc["filename"], 
                    "page_number": doc["page_number"],
                    "file_path": doc.get("file_path", "")
                }]
            )
            
            for split_doc in split_docs:
                chunks.append({
                    "chunk_text": split_doc.page_content,
                    "metadata": split_doc.metadata
                })
        print(f"Created {len(chunks)} chunks")
        return chunks

    def create_embeddings(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Create text embeddings from PDF chunks.
        Each item must contain 'chunk_text' field.

        Returns:
            List[Dict[str, Any]]: Each entry contains id, embedding vector, metadata, and text.
        """
        print(f"Creating embeddings for {len(data)} chunks...")
        if not data:
            raise NoChunksToEmbedException()
  
        valid_items = []
        input_texts = []
        
        for item in data:
            text = str(item.get("chunk_text", "")).strip()
            if not text:
                continue
            valid_items.append(item)
            input_texts.append(text)
        if not input_texts:
            raise NoChunksToEmbedException()
        
        print(f"Processing {len(input_texts)} valid text chunks...")
        try:
            embeddings = self.embedding_model.encode(
                input_texts,
                normalize_embeddings=True,
                show_progress_bar=True,
                batch_size=32
            )
            if hasattr(embeddings, "tolist"):
                embeddings = embeddings.tolist()
        except Exception as e:
            raise EmbeddingModelException(f"Embedding model error: {e}")

        # Construct final structured results
        results = []
        for i, (item, embedding, text_content) in enumerate(zip(valid_items, embeddings, input_texts)):
            chunk_id = str(uuid.uuid4())
            
            metadata_info = item.get("metadata", {})
                
            metadata = {
                "filename": metadata_info.get("filename", ""),
                "page_number": metadata_info.get("page_number", 0),
                "file_path": metadata_info.get("file_path", ""),
                "text": text_content
            }

            results.append({
                "id": chunk_id,
                "values": embedding,
                "metadata": metadata,
                "text": text_content
            })

        print(f"Successfully created {len(results)} embeddings")
        return results

    def add_embeddings_to_pinecone(self, embed_docs: List[Dict[str, Any]]) -> int:
        print(f"Adding {len(embed_docs)} embeddings to Pinecone...")
        if not embed_docs:
            return 0
        total_vectors_added = 0
        for i in range(0, len(embed_docs), PINECONE_BATCH_SIZE):
            batch = embed_docs[i : i + PINECONE_BATCH_SIZE]
            print(f"Processing batch {i // PINECONE_BATCH_SIZE + 1}...")
            vectors_to_upsert = []
            for doc in batch:
                vectors_to_upsert.append({
                    "id": doc["id"],
                    "values": doc["values"],
                    "metadata": doc["metadata"]
                })
            try:
                self.index.upsert(vectors=vectors_to_upsert, namespace=pinecone_namespace)
                total_vectors_added += len(vectors_to_upsert)
            except Exception as e:
                raise PineconeUpsertException(str(e))
        print(f"Successfully added {total_vectors_added} vectors to Pinecone")
        return total_vectors_added

    def retrieve_relevant_chunks(self, query: str, top_k: int = 5, min_score: float = 0.5):
        """
        Retrieve relevant PDF chunks based on query.
        Returns a list of documents and highest scored file_path (if any).
        """
        print(f"Retrieving relevant chunks for query: '{query}' (top_k={top_k}, min_score={min_score})")
        try:
            print("Creating query embedding...")
            query_emb = self.embedding_model.encode(query, normalize_embeddings=True).tolist()
            results = self.index.query(
                vector=query_emb,
                top_k=top_k,
                namespace=pinecone_namespace,
                include_metadata=True
            )
            
            docs = []
            highest_score = float("-inf")
            highest_url = None

            for match in results.get('matches', []):
                score = match.get('score', 0)
                metadata = match.get('metadata', {}) or {}
                text = metadata.get('text', '')
                if score >= min_score and text:
                    doc = Document(
                        page_content=text,
                        metadata={
                            'filename': metadata.get('filename', ''),
                            'page_number': metadata.get('page_number', 0),
                            'file_path': metadata.get('file_path', ''),
                            'score': score
                        }
                    )
                    docs.append(doc)
                    if score > highest_score:
                        highest_score = score
                        highest_url = metadata.get('file_path', '')
            print(f"Found {len(docs)} relevant chunks")
            return docs, highest_url
        except Exception as e:
            raise PineconeQueryException(str(e))