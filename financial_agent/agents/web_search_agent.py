from phi.agent import Agent
from phi.model.groq import Groq
from phi.tools.duckduckgo import DuckDuckGo

# agent configuration
AGENT_NAME       = "Web Search Agent"
AGENT_ROLE       = "Search the web for information"
AGENT_MODEL_ID   = "llama-3.3-70b-versatile"
SHOW_TOOL_CALLS  = False
MARKDOWN_OUTPUT  = True

AGENT_INSTRUCTIONS = [
    "Always include sources",
    "NEVER mention function names, tool names, or internal method calls (e.g. duckduckgo_search) "
    "in your response. Just present the result naturally.",
]

# Tool Initialization
# DuckDuckGo is used as the search backend. No API key is required.

def build_duckduckgo_tool():
    try:
        return DuckDuckGo()
    except Exception as e:
        raise RuntimeError(f"[web_search_agent] Failed to initialize DuckDuckGo tool: {e}")

def build_groq_model():
    try:
        return Groq(id=AGENT_MODEL_ID)
    except Exception as e:
        raise RuntimeError(f"[web_search_agent] Failed to initialize Groq model: {e}")

def build_web_search_agent():
    try:
        model = build_groq_model()
        tool  = build_duckduckgo_tool()
        return Agent(
            name=AGENT_NAME,
            role=AGENT_ROLE,
            model=model,
            tools=[tool],
            instructions=AGENT_INSTRUCTIONS,
            show_tools_calls=SHOW_TOOL_CALLS,
            markdown=MARKDOWN_OUTPUT,
            add_history_to_messages=True,
            num_history_responses=3,
        )
    except Exception as e:
        raise RuntimeError(f"[web_search_agent] Failed to initialize agent: {e}")

web_search_agent = build_web_search_agent()

