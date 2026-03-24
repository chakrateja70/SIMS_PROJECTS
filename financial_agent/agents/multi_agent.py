from phi.agent import Agent
from phi.model.groq import Groq
from phi.tools.yfinance import YFinanceTools
from phi.tools.duckduckgo import DuckDuckGo

# Agent Configuration Constants

AGENT_NAME      = "Multi AI Agent"
AGENT_MODEL_ID  = "meta-llama/llama-4-scout-17b-16e-instruct"
SHOW_TOOL_CALLS = False
MARKDOWN_OUTPUT = True

AGENT_INSTRUCTIONS = [
    "Use tables for structured data. Include sources. Respond in markdown.",
    "Indian stocks: append .NS for NSE (e.g. RELIANCE.NS, TCS.NS) or .BO for BSE. Resolve company names to correct tickers before querying.",
    "Always use built-in tools for stock data. Never suggest external sites, output URLs, or mention internal tool/function names. If data unavailable, say so and offer to retry.",
    "Only call finance tools when a ticker is present. If missing, ask first. For general questions use web search.",
]

def build_duckduckgo_tool():
    try:
        return DuckDuckGo()
    except Exception as e:
        raise RuntimeError(f"[multi_ai_agent] Failed to initialize DuckDuckGo tool: {e}")

def build_yfinance_tool():
    try:
        return YFinanceTools(
            stock_price=True,
            analyst_recommendations=True,
            stock_fundamentals=True,
            company_news=True,
        )
    except Exception as e:
        raise RuntimeError(f"[multi_ai_agent] Failed to initialize YFinanceTools: {e}")

def build_groq_model():
    try:
        return Groq(id=AGENT_MODEL_ID)
    except Exception as e:
        raise RuntimeError(f"[multi_ai_agent] Failed to initialize Groq model: {e}")

def build_multi_agent():
    try:
        model        = build_groq_model()
        search_tool  = build_duckduckgo_tool()
        finance_tool = build_yfinance_tool()
        return Agent(
            name=AGENT_NAME,
            model=model,
            tools=[search_tool, finance_tool],
            instructions=AGENT_INSTRUCTIONS,
            markdown=MARKDOWN_OUTPUT,
            show_tools_calls=SHOW_TOOL_CALLS,
            add_history_to_messages=True,
            num_history_responses=3,
        )
    except Exception as e:
        raise RuntimeError(f"[multi_ai_agent] Failed to initialize agent: {e}")

multi_ai_agent = build_multi_agent()

