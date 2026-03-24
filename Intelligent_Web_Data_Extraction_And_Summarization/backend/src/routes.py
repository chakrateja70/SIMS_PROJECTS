from typing import Union
from fastapi import APIRouter
from src.core.exceptions import AppError
from src.schemas.response import (
    CrawlErrorResponse,
    CrawlRequest,
    CrawlSuccessResponse,
    ScrapeErrorResponse,
    ScrapeRequest,
    ScrapeSuccessResponse,
    SummarizeRequest,
)
from src.services.web_service import WebService
from src.utils.crawl_tool import CrawlTool
from src.utils.scrape_tool import ScrapeTool
from src.schemas.response import SummarizeRequest
from src.services.groq_llm_service import service


router = APIRouter()
crawl_service = CrawlTool()
scrape_service = ScrapeTool()
 
 
@router.post("/crawl")
async def crawl(
    body: CrawlRequest,
) -> Union[CrawlSuccessResponse, CrawlErrorResponse]:
    """
    Crawl a website and return results in markdown.
    Accepts a seed URL, max pages, scrape options, and session options.
    """
    try:
        result = await crawl_service.run(body)
        return CrawlSuccessResponse(
            message=f"Crawled {result.pages_crawled} page(s) successfully.",
            data=result,
        )
    except AppError as exc:
        return CrawlErrorResponse(
            statusCode=exc.status_code,
            message=exc.detail,
        )
 
 
@router.post("/scrape")
async def scrape(
    body: ScrapeRequest,
) -> Union[ScrapeSuccessResponse, ScrapeErrorResponse]:
    """
    Scrape a single page and return content in markdown.
    Accepts a target URL, scrape options, and session options.
    """
    try:
        result = await scrape_service.run(body)
        return ScrapeSuccessResponse(
            message="Page scraped successfully.",
            data=result,
        )
    except AppError as exc:
        return ScrapeErrorResponse(
            statusCode=exc.status_code,
            message=exc.detail,
        )
    

@router.post("/summarize")
async def summarize(request: SummarizeRequest):
    if request.method == "scrape":
        scrape_req = ScrapeRequest(
            url=request.url,
            focus=request.focus
        )
        tool = ScrapeTool()
        scrape_result = await tool.run(scrape_req)
        content = scrape_result.markdown
    elif request.method == "crawl":
        crawl_req = CrawlRequest(
            url=request.url,
            focus=request.focus,
            max_pages=request.max_pages
        )
        tool = CrawlTool()
        crawl_result = await tool.run(crawl_req)
        content = "\n".join(
            [page.markdown for page in crawl_result.results]
        )
    summary = await service.asummarize(
        content=content,
        focus=request.focus
    )
    return {
        "url": request.url,
        "method": request.method,
        "summary": summary
    }