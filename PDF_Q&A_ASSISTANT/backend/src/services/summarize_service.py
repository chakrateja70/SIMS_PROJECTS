from src.services.llm_service import llm_service
from src.core.prompts import (
    SHORT_PASS_SUMMARY_PROMPT_TEMPLATE,
    MAP_CHUNK_SUMMARY_PROMPT_TEMPLATE,
    REDUCE_SUMMARY_COMBINE_PROMPT_TEMPLATE,
)

# Max characters sent to LLM in a single call (~8k tokens for safety margin)
CHUNK_SIZE = 8000

_STYLE_INSTRUCTIONS = {
    "short": "short paragraph summary (3-5 sentences)",
    "detailed": "detailed summary covering all main points",
    "bullets": "bullet-point summary listing the key points",
}

def get_summary(text: str, style: str = "detailed", llm: str = "groq") -> str:
    """
    Summarize `text` using Groq and the given summary style.
    Automatically uses map-reduce for long documents.

    Args:
        text:  Raw document text to summarize.
        style: One of 'short', 'detailed', 'bullets'.
        llm:   Unused (kept for API compatibility). Always uses Groq.

    Returns:
        Summary string.
    """
    service = llm_service
    style_desc = _STYLE_INSTRUCTIONS.get(style, _STYLE_INSTRUCTIONS["detailed"])

    text = text.strip()
    if not text:
        return "No text provided for summarization."

    if len(text) <= CHUNK_SIZE:
        prompt = SHORT_PASS_SUMMARY_PROMPT_TEMPLATE.format(text=text, style=style_desc)
        return service.generate_text(prompt)

    # Map-reduce for long documents
    chunks = [text[i: i + CHUNK_SIZE] for i in range(0, len(text), CHUNK_SIZE)]
    chunk_summaries = []
    for chunk in chunks:
        prompt = MAP_CHUNK_SUMMARY_PROMPT_TEMPLATE.format(text=chunk)
        chunk_summaries.append(service.generate_text(prompt))

    combined = "\n\n---\n\n".join(chunk_summaries)
    final_prompt = REDUCE_SUMMARY_COMBINE_PROMPT_TEMPLATE.format(
        summaries=combined, style=style_desc
    )
    return service.generate_text(final_prompt)