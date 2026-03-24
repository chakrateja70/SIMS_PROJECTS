from __future__ import annotations
from typing import Any, Dict
from openai import AsyncOpenAI  
from src.config.settings import settings


class GroqClient:
    """
    A tiny façade that hides the SDK details from the service layer.
    It is deliberately async- FastAPI can await it without blocking the event loop.
    """

    def __init__(self) -> None:
        self._client = AsyncOpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url=settings.GROQ_BASE_URL,
        )
        
    async def generate(
        self,
        *,
        prompt: str,
        model: str | None = None,
        **extra: Any,
    ) -> Dict[str, Any]:
        """
        Sends a request to Groq and returns the raw JSON response.
        ``extra`` can be used to forward any additional OpenAI parameters
        (temperature, max_tokens, etc.).
        """
        response = await self._client.responses.create(
            input=prompt,
            model=model or settings.GROQ_DEFAULT_MODEL,
            **extra,
        )
        # The SDK returns a `Response` object; we turn it into a dict for convenience.
        return {
            "output_text": getattr(response, "output_text", ""),
            "model": model or settings.GROQ_DEFAULT_MODEL,
            "usage": getattr(response, "usage", None),
        }

groq_client = GroqClient()