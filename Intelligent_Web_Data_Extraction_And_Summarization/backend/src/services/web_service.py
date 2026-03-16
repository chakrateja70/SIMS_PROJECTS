from __future__ import annotations
from src.schemas.response import (ScrapeRequest, ScrapeResult, SummarizeRequest,
    SummarizeResult)
from src.utils.crawl_tool import CrawlTool
from src.utils.scrape_tool import ScrapeTool
from src.services.groq_llm_service import GroqLLMService
from src.config.settings import settings

_ALLOWED = {"markdown"}


class WebService:
    def __init__(self) -> None:
        self._crawl = CrawlTool()
        self._scrape = ScrapeTool()
        self._groq = GroqLLMService()

    @staticmethod
    def _extract_text(result: ScrapeResult) -> str:
        return result.markdown or ""

    async def asummarize(self, request: SummarizeRequest) -> SummarizeResult:
        """
        Scrape the given URL then summarize the extracted content via Groq.
        Steps:
            1. Build a ScrapeRequest from the SummarizeRequest fields.
            2. Scrape the page (markdown format for best LLM input).
            3. Extract plain text from the scrape result.
            4. Send to Groq and return the summary.
        """
        scrape_request = ScrapeRequest(
            url=request.url,
        )

        scrape_result = await self._scrape.run(scrape_request)
        raw_text = self._extract_text(scrape_result)

        summary = await self._groq.asummarize(
            content=raw_text,
            focus=request.focus,
        )

        return SummarizeResult(
            url=request.url,
            model=settings.GROQ_DEFAULT_MODEL,
            focus=request.focus,
            summary=summary,
            scraped_content_length=len(raw_text),
        )