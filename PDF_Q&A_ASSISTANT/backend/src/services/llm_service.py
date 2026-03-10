# services/llm_service.py
from typing import Optional
from src.config import settings
from groq import Groq, APIError
from src.core.exceptions import LLMServiceAPIException, LLMServiceUnexpectedException
from src.core.prompts import RAG_QA_PROMPT_TEMPLATE


class LLMService:
    """
    Groq-backed LLM service (Singleton).
    Used by the RAG pipeline for question answering.
    """
    _instance = None
    _client: Optional[Groq] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LLMService, cls).__new__(cls)
            cls._client = Groq(api_key=settings.GROQ_API_KEY)
        return cls._instance

    def generate_text(self, prompt: str) -> str:
        """Send a raw prompt and return the model response."""
        if self._client is None:
            raise LLMServiceUnexpectedException("LLM client not initialized")
        try:
            chat_completion = self._client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=settings.LLAMA_LLM_MODEL,
                temperature=0.3,
                max_tokens=2048,
            )
            content = chat_completion.choices[0].message.content
            if content is None:
                raise LLMServiceUnexpectedException("LLM returned empty response")
            return content.strip()
        except APIError as e:
            raise LLMServiceAPIException(str(e))
        except Exception as e:
            raise LLMServiceUnexpectedException(str(e))

    def generate_answer(self, context: str, question: str) -> str:
        """Generates an answer using the Groq client."""
        if self._client is None:
            raise LLMServiceUnexpectedException("LLM client not initialized")
        try:
            formatted_prompt = RAG_QA_PROMPT_TEMPLATE.format(context=context, question=question)
            chat_completion = self._client.chat.completions.create(
                messages=[{"role": "user", "content": formatted_prompt}],
                model=settings.LLAMA_LLM_MODEL,
                temperature=0.2,
                max_tokens=1024,
            )
            content = chat_completion.choices[0].message.content
            if content is None:
                raise LLMServiceUnexpectedException("LLM returned empty response")
            return content.strip()
        except APIError as e:
            raise LLMServiceAPIException(str(e))
        except Exception as e:
            raise LLMServiceUnexpectedException(str(e))


llm_service = LLMService()
