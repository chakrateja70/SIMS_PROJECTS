from __future__ import annotations
from fastapi import HTTPException
from starlette import status


class AppError(HTTPException):
    """Single app-level exception: raise AppError(status_code, detail_message)."""
    def __init__(self, status_code: int, message: str):
        super().__init__(status_code=status_code, detail=message)


class GroqAPIException(AppError):
    """Raised when the Groq request fails (network, auth, model, etc.)."""
    def __init__(self, original_exc: Exception) -> None:
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            message=f"Failed to communicate with the LLM provider: {original_exc}",
        )