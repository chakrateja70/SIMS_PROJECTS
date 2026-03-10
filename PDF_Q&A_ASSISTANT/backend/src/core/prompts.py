RAG_QA_PROMPT_TEMPLATE = """
        You are a helpful assistant. Answer the user's question using ONLY the provided context.
        Do NOT include source names, references, or document titles in your answer.
        If the context does not contain enough information, say so clearly.
        Context: {context}
        Question: {question}
        Answer:
    """

SHORT_PASS_SUMMARY_PROMPT_TEMPLATE = """
You are an expert summarization assistant.

Document Text:
{text}

Task: Produce a {style} of the above document.
Respond with ONLY the summary - no preamble, no meta-commentary.
"""

MAP_CHUNK_SUMMARY_PROMPT_TEMPLATE = """
Summarize the following document excerpt, preserving all key facts, figures, and arguments. Be concise.

Excerpt:
{text}

Summary:
"""

REDUCE_SUMMARY_COMBINE_PROMPT_TEMPLATE = """
You are an expert summarization assistant.
Below are summaries of sequential sections of a document. Combine them into one coherent {style}.
Do NOT include meta-commentary - output ONLY the final summary.

Section Summaries:
{summaries}

Final Summary:
"""
