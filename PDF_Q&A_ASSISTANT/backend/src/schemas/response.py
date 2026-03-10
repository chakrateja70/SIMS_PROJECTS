from pydantic import BaseModel
from typing import Optional, Any, Dict, List

class ResponseBase(BaseModel):
    """Base response model"""
    success: bool
    message: str
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    message: str
    error: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class DocumentProcessSuccessResponse(BaseModel):
    statusCode: int = 200
    success: bool
    message: str
    documents_processed: int
    vectors_stored: int

class PaginatedResponse(BaseModel):
    """Paginated response model"""
    success: bool = True
    message: str
    data: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int

class QuerySuccessResponse(BaseModel):
    statusCode: int = 200
    success: bool
    message: str
    query: str
    answer: str
    sources: List[str] = []

class QueryNotFoundResponse(BaseModel):
    statusCode: int = 404
    success: bool = False
    message: str
    query: str
    answer: str

class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    min_score: Optional[float] = 0.5