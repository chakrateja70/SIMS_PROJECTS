from __future__ import annotations
import re
from typing import Optional, List


def make_preview(markdown: str) -> str:
    return markdown.strip()


def extract_title(markdown: str) -> Optional[str]:
    match = re.search(r"^#\s+(.+)$", markdown, re.MULTILINE)
    return match.group(1).strip() if match else None


def extract_headings(markdown: str) -> List[str]:
    return [m.group(0).strip() for m in re.finditer(r"^#{1,6}\s+.+$", markdown, re.MULTILINE)]
