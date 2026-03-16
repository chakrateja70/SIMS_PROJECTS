from __future__ import annotations
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field, field_validator,model_validator
from starlette.status import HTTP_200_OK
from src.core.enums import OutputFormat
from typing import Optional, Literal



_URL_PREFIXES = ("http://", "https://")


def _validate_url(v: str) -> str:
    if not v.startswith(_URL_PREFIXES):
        raise ValueError("URL must start with http:// or https://")
    return v.rstrip("/")

T = TypeVar("T")

class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    statusCode: int = HTTP_200_OK
    message: str
    data: T


class ErrorResponse(BaseModel):
    success: bool = False
    statusCode: int
    message: str
    data: None = None

class ScrapeOptions(BaseModel):
    formats: List[OutputFormat] = Field(
        default=[OutputFormat.MARKDOWN],
        description="Output formats: markdown",
    )

    @field_validator("formats")
    @classmethod
    def at_least_one(cls, v: list) -> list:
        if not v:
            raise ValueError("At least one output format must be specified.")
        return v

    def to_payload(self) -> dict:
        return {"formats": [f.value for f in self.formats]}


class SessionOptions(BaseModel):
    use_proxy: bool = Field(default=False, description="Route requests through a proxy.")
    solve_captchas: bool = Field(default=False, description="Automatically solve CAPTCHAs.")

    def to_payload(self) -> dict:
        return {"use_proxy": self.use_proxy, "solve_captchas": self.solve_captchas}

class PageResult(BaseModel):
    url: str
    title: Optional[str]
    markdown: str
    preview: str
    headings: List[str]


# ScrapeResult is structurally identical to PageResult
ScrapeResult = PageResult

class ScrapeRequest(BaseModel):
    url: str = Field(..., description="Target page URL.")
    focus: Optional[str] = Field(
        default=None,
        description="Optional focus hint for the summary e.g. 'pricing', 'features', 'news'.",
    )

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        return _validate_url(v)

    def to_payload(self) -> dict:
        return {"url": self.url, "focus": self.focus}


ScrapeSuccessResponse = SuccessResponse[ScrapeResult]
ScrapeErrorResponse = ErrorResponse


class CrawlRequest(BaseModel):
    url: str = Field(..., description="Seed URL to start crawling from.")
    max_pages: int = Field(default=2, ge=1, le=500, description="Max pages to crawl (1-500).")
    focus: Optional[str] = Field(
        default=None,
        description="Optional focus hint for the summary e.g. 'pricing', 'features', 'news'.",
    )


    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        return _validate_url(v)

    def to_payload(self) -> dict:
        return {
            "url": self.url,
            "max_pages": self.max_pages,
        }


class CrawlResult(BaseModel):
    url: str
    max_pages: int
    pages_crawled: int
    results: List[PageResult]


CrawlSuccessResponse = SuccessResponse[CrawlResult]
CrawlErrorResponse = ErrorResponse


class SummarizeRequest(BaseModel):
    url: str = Field(..., description="URL to scrape or crawl")
    method: Literal["scrape", "crawl"] = Field(
        ..., description="Select extraction method"
    )
    focus: Optional[str] = Field(
        default=None,
        description="Optional focus hint for summary"
    )
    max_pages: Optional[int] = Field(
        default=3,
        description="Used only when method = crawl"
    )

    @model_validator(mode="after")
    def validate_fields(self):

        if self.method == "scrape":
            self.max_pages = None

        return self

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        return _validate_url(v)


class SummarizeResult(BaseModel):
    url: str
    model: str
    focus: Optional[str]
    summary: str
    scraped_content_length: int


SummarizeSuccessResponse = SuccessResponse[SummarizeResult]
SummarizeErrorResponse = ErrorResponse