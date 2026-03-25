# =============================================================================
# financial_agent.py

# Agents:
#   - finance_agent      → Yahoo Finance stock data (agents/finance_agent.py)
#   - web_search_agent   → DuckDuckGo web search    (agents/web_search_agent.py)
#   - multi_ai_agent     → Finance + Web combined   (agents/multi_agent.py)
#
# Usage:
#   python financial_agent.py
# =============================================================================

from dotenv import load_dotenv
import os
from queries import FINANCE_AGENT_QUERY, WEB_SEARCH_AGENT_QUERY, MULTI_AGENT_QUERY
from agents.finance_agent import finance_agent
from agents.web_search_agent import web_search_agent
from agents.multi_agent import multi_ai_agent

def load_environment():
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set. Check your .env file.")
    os.environ["GROQ_API_KEY"] = api_key


def run_finance_agent():
    try:
        finance_agent.print_response(
            FINANCE_AGENT_QUERY,
            stream=True,
        )  # using financial agent to get financial data
    except Exception as e:
        raise RuntimeError(f"Finance agent error: {e}")


def run_web_search_agent():
    try:
        web_search_agent.print_response(
            WEB_SEARCH_AGENT_QUERY,
            stream=True,
        )  # using web search agent to get web search data
    except Exception as e:
        raise RuntimeError(f"Web search agent error: {e}")


def run_multi_agent():
    try:
        multi_ai_agent.print_response(
            MULTI_AGENT_QUERY,
            stream=True,
        )  # using multi ai agent to get financial data and web search data
    except Exception as e:
        raise RuntimeError(f"Multi AI agent error: {e}")


def main():
    load_environment()
    run_finance_agent()
    run_web_search_agent()
    run_multi_agent()


if __name__ == "__main__":
    main()


