import os
from dotenv import load_dotenv

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE")
PINECONE_BATCH_SIZE = os.getenv("PINECONE_BATCH_SIZE")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
POPPLER_PATH = os.getenv("POPPLER_PATH")

LLAMA_LLM_MODEL: str = "llama-3.1-8b-instant"