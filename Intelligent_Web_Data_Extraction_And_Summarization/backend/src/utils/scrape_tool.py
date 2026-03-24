# type: ignore
from __future__ import annotations
from http import HTTPStatus

from langchain_hyperbrowser import HyperbrowserScrapeTool

from src.config.settings import settings
from src.core.exceptions import AppError
from src.schemas.response import ScrapeRequest, ScrapeResult
from src.utils.helper import extract_headings, extract_title, make_preview

_tool = HyperbrowserScrapeTool(api_key=settings.HYPERBROWSER_API_KEY)


def _extract_markdown(raw: object) -> str:
    """Extract markdown from tool response."""

    if isinstance(raw, str):
        return raw

    if isinstance(raw, dict):
        return str(raw.get("markdown") or raw.get("data") or raw)

    return str(raw)


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


class ScrapeTool:
    __slots__ = ()

    async def run(self, request: ScrapeRequest) -> ScrapeResult:
        try:
            raw = await _tool.arun(request.to_payload())

            md = _extract_markdown(raw)

            return ScrapeResult(
                url=request.url,
                focus=request.focus,
                markdown=md,
                preview=make_preview(md),
                title=extract_title(md),
                headings=extract_headings(md),
            )

        except AppError:
            raise

        except Exception as exc:
            raise _map(exc) from exc