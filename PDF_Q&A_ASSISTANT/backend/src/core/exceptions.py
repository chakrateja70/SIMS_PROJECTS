from fastapi import HTTPException
from starlette.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_404_NOT_FOUND,
    HTTP_500_INTERNAL_SERVER_ERROR
)

STATUS_MESSAGES = {
    HTTP_400_BAD_REQUEST: "Bad Request",
    HTTP_404_NOT_FOUND: "Not Found",
    HTTP_500_INTERNAL_SERVER_ERROR: "Internal Server Error"
}


class BaseAPIException(HTTPException):
    """Base exception class for all API exceptions."""

    def __init__(self, status_code: int, status_message: str, error_message: str):
        super().__init__(
            status_code=status_code,
            detail={
                "statusCode": status_code,
                "statusMessage": status_message,
                "errorMessage": error_message
            }
        )


class DocumentFolderNotFoundException(BaseAPIException):
    """Raised when the document folder is not found."""
    def __init__(self, folder_path: str):
        super().__init__(
            HTTP_404_NOT_FOUND,
            STATUS_MESSAGES[HTTP_404_NOT_FOUND],
            f"Document folder not found: {folder_path}"
        )


class DocumentProcessingException(BaseAPIException):
    """Raised when there is an error in document processing."""
    def __init__(self, message="Error occurred while processing the document"):
        super().__init__(
            HTTP_400_BAD_REQUEST,
            STATUS_MESSAGES[HTTP_400_BAD_REQUEST],
            message
        )


class NoChunksToEmbedException(BaseAPIException):
    """Raised when there are no chunks to embed."""
    def __init__(self, message="No valid chunks found to create embeddings"):
        super().__init__(
            HTTP_400_BAD_REQUEST,
            STATUS_MESSAGES[HTTP_400_BAD_REQUEST],
            message
        )


class EmbeddingModelException(BaseAPIException):
    """Raised when there is an error with the embedding model."""
    def __init__(self, message="Embedding model encountered an error"):
        super().__init__(
            HTTP_400_BAD_REQUEST,
            STATUS_MESSAGES[HTTP_400_BAD_REQUEST],
            message
        )


class PineconeInitializationException(BaseAPIException):
    """Raised when Pinecone initialization fails."""
    def __init__(self, message="Failed to initialize Pinecone"):
        super().__init__(
            HTTP_500_INTERNAL_SERVER_ERROR,
            STATUS_MESSAGES[HTTP_500_INTERNAL_SERVER_ERROR],
            message
        )


class PineconeQueryException(BaseAPIException):
    """Raised when a Pinecone query fails."""
    def __init__(self, message="Pinecone query failed"):
        super().__init__(
            HTTP_500_INTERNAL_SERVER_ERROR,
            STATUS_MESSAGES[HTTP_500_INTERNAL_SERVER_ERROR],
            message
        )


class PineconeUpsertException(BaseAPIException):
    """Raised when a Pinecone upsert operation fails."""
    def __init__(self, message="Pinecone upsert failed"):
        super().__init__(
            HTTP_500_INTERNAL_SERVER_ERROR,
            STATUS_MESSAGES[HTTP_500_INTERNAL_SERVER_ERROR],
            message
        )


class LLMServiceAPIException(BaseAPIException):
    """Raised when there is an API error with the LLM service."""
    def __init__(self, message="LLM service API error"):
        super().__init__(
            HTTP_500_INTERNAL_SERVER_ERROR,
            STATUS_MESSAGES[HTTP_500_INTERNAL_SERVER_ERROR],
            message
        )


class LLMServiceUnexpectedException(BaseAPIException):
    """Raised when there is an unexpected error with the LLM service."""
    def __init__(self, message="Unexpected error occurred with the LLM service"):
        super().__init__(
            HTTP_500_INTERNAL_SERVER_ERROR,
            STATUS_MESSAGES[HTTP_500_INTERNAL_SERVER_ERROR],
            message
        )