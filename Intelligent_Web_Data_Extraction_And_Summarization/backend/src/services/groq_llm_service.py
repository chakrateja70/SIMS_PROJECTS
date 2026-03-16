from __future__ import annotations
import textwrap
from src.core.client import groq_client
from src.core.exceptions import GroqAPIException


class GroqLLMService:
    """
    Public API for the rest of the code base.
    Keeps the FastAPI router thin and makes unit-testing easy.
    """

    async def asummarize(self, *, content: str, focus: str | None = None) -> str:
        """
                Build a concise prompt from already scraped content and return markdown summary.

        """
        try:
            if focus:
                instruction = (
                    f"Summarize the following web page with a focus on **{focus}**. "
                )
            else:
                instruction = "Summarize the following web page."

            prompt = textwrap.dedent(
                f"""
                {instruction}
                ----
                {content}
                ----
                summarize the content above.
                """
            ).strip()

            response = await groq_client.generate(
                prompt=prompt,
                temperature=0.7,
            )

            return response["output_text"]

        except Exception as exc:   
            raise GroqAPIException(exc) from exc

service = GroqLLMService()