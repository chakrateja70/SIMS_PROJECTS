from pinecone import Pinecone, ServerlessSpec
from src.config import settings
from src.core.exceptions import PineconeInitializationException

pinecone_api_key = settings.PINECONE_API_KEY
pinecone_index_name = settings.PINECONE_INDEX_NAME

pc = Pinecone(pinecone_api_key)

def pinecone_connection():
    """
    Connect to Pinecone and create an index if it doesn't exist.
    """
    if pinecone_index_name is None:
        raise PineconeInitializationException("PINECONE_INDEX_NAME is not configured")
    
    try:
        if pinecone_index_name not in pc.list_indexes().names():
            pc.create_index(
                name=pinecone_index_name,
                dimension=768,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
    except Exception as e:
        raise PineconeInitializationException(str(e))

# Create index connection for global use
if pinecone_index_name is None:
    raise PineconeInitializationException("PINECONE_INDEX_NAME is not configured")
index = pc.Index(pinecone_index_name)