# type: ignore
from __future__ import annotations
from http import HTTPStatus
from typing import Any, List
from langchain_hyperbrowser import HyperbrowserCrawlTool
from src.config.settings import settings
from src.core.exceptions import AppError
from src.schemas.response import CrawlRequest, CrawlResult, PageResult
from src.utils.helper import extract_headings, extract_title, make_preview

_tool = HyperbrowserCrawlTool(api_key=settings.HYPERBROWSER_API_KEY)


def _extract_page(raw_page: Any, fallback_url: str) -> PageResult:
    """Convert raw crawl result into PageResult."""

    if isinstance(raw_page, dict):
        url = raw_page.get("url", fallback_url)
        md = str(raw_page.get("markdown") or raw_page.get("data") or raw_page)
    else:
        url = fallback_url
        md = str(raw_page)

    return PageResult(
        url=url,
        markdown=md,
        preview=make_preview(md),
        title=extract_title(md),
        headings=extract_headings(md),
    )


def _map(exc: Exception) -> AppError:
    msg = str(exc).lower()

    if "401" in msg or "unauthorized" in msg or "api key" in msg:
        return AppError(HTTPStatus.UNAUTHORIZED, str(exc))

    if "429" in msg or "rate limit" in msg:
        return AppError(HTTPStatus.TOO_MANY_REQUESTS, str(exc))

    if "timeout" in msg:
        return AppError(HTTPStatus.REQUEST_TIMEOUT, str(exc))

    if "invalid url" in msg:
        return AppError(HTTPStatus.BAD_REQUEST, str(exc))

    return AppError(HTTPStatus.INTERNAL_SERVER_ERROR, str(exc))


class CrawlTool:
    __slots__ = ()

    async def run(self, request: CrawlRequest) -> CrawlResult:
        try:
            raw: Any = await _tool.arun(request.to_payload())

            raw_list: List[Any] = raw if isinstance(raw, list) else [raw]

            results = [_extract_page(page, request.url) for page in raw_list]

            return CrawlResult(
                url=request.url,
                focus=request.focus,
                max_pages=request.max_pages,
                pages_crawled=len(results),
                results=results,
            )

        except AppError:
            raise

        except Exception as exc:
            raise _map(exc) from exc