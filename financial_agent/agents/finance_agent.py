from phi.agent import Agent
from phi.model.groq import Groq
from phi.tools.yfinance import YFinanceTools

# agent configuration
AGENT_NAME      = "Financial Agent"
AGENT_MODEL_ID  = "llama-3.3-70b-versatile"
SHOW_TOOL_CALLS = False
MARKDOWN_OUTPUT = True

AGENT_INSTRUCTIONS = [
    "Use tables for structured data. Respond in markdown.",
    "Indian stocks: append .NS for NSE (e.g. RELIANCE.NS, TCS.NS) or .BO for BSE. Resolve company names to correct tickers before querying.",
    "Always use built-in tools for prices, fundamentals, analyst data, and news. Never suggest external sites or output URLs. If data unavailable, say so and offer to retry with a different ticker.",
    "Only call a tool when a ticker or company name is present in the query. If missing, ask the user before making any tool call.",
    "IMPORTANT: Always attempt to call the yfinance tool with the given ticker. Never say you don't have access to a stock. If the tool returns no data, then report it as unavailable.",
    "Do not use your training knowledge to judge whether a ticker is valid. Always pass the ticker directly to the tool and let the tool determine if data exists.",
]


def build_yfinance_tool():
    try:
        return YFinanceTools(
            stock_price=True,
            analyst_recommendations=True,
            stock_fundamentals=True,
            company_news=True,
        )
    except Exception as e:
        raise RuntimeError(f"[finance_agent] Failed to initialize YFinanceTools: {e}")


def build_groq_model():
    try:
        return Groq(id=AGENT_MODEL_ID)
    except Exception as e:
        raise RuntimeError(f"[finance_agent] Failed to initialize Groq model: {e}")


def build_finance_agent():
    try:
        model = build_groq_model()
        tool  = build_yfinance_tool()
        return Agent(
            name=AGENT_NAME,
            model=model,
            tools=[tool],
            instructions=AGENT_INSTRUCTIONS,
            show_tools_calls=SHOW_TOOL_CALLS,
            markdown=MARKDOWN_OUTPUT,
            add_history_to_messages=True,
            num_history_responses=3,
        )
    except Exception as e:
        raise RuntimeError(f"[finance_agent] Failed to build agent: {e}")


finance_agent = build_finance_agent()


