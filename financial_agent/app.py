# =============================================================================
# app.py — FastAPI web server for the Financial Agent UI
# =============================================================================

from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from cachetools import TTLCache
from dotenv import load_dotenv
import os
import re
import traceback
import httpx
import hashlib
import threading

# ── Helpers ──────────────────────────────────────────────────────────────────
def _extract_failed_generation(error_msg: str) -> str:
    """
    Extract the LLM's natural-language text from a GROQ tool_use_failed error.
    Returns empty string if the failed_generation is a raw tool-call tag (not human-readable).
    """
    for marker in ["'failed_generation': '", '"failed_generation": "', "'failed_generation': \"", '"failed_generation": \'']:
        idx = error_msg.find(marker)
        if idx != -1:
            text = error_msg[idx + len(marker):]
            text = text.rstrip("'\"} \n\r").strip()
            # If it's a raw function/tool call tag, discard it — use fallback instead
            if text.startswith("<function=") or text.startswith("```") or not text:
                return ""
            return text
    return ""


# ── Load environment ──────────────────────────────────────────────────────────
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY is not set. Check your .env file.")
os.environ["GROQ_API_KEY"] = api_key

sarvam_api_key = os.getenv("SARVAM_API_KEY")
if not sarvam_api_key:
    raise ValueError("SARVAM_API_KEY is not set. Check your .env file.")

# ── Import agents ────────────────────────────────────────────────────────────
from agents.finance_agent import finance_agent
from agents.web_search_agent import web_search_agent
from agents.multi_agent import multi_ai_agent

# ── FastAPI app ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["30/minute"])
app = FastAPI(title="Finance Sight", docs_url=None, redoc_url=None)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ── Response cache (TTL = 5 min, max 256 entries) ────────────────────────────
_cache: TTLCache = TTLCache(maxsize=256, ttl=300)
_cache_lock = threading.Lock()

MAX_QUERY_LEN = 1000   # characters

AGENT_MAP = {
    "finance":    finance_agent,
    "web_search": web_search_agent,
    "multi":      multi_ai_agent,
    "auto":       multi_ai_agent,   # safety fallback — detect_agent() replaces this at runtime
}

# ── Keyword-based auto-routing ────────────────────────────────────────────────
_FINANCE_KEYWORDS = {
    "stock", "share", "price", "ticker", "market", "nse", "bse",
    "nasdaq", "nyse", "dividend", "earnings", "pe ratio", "fundamental",
    "analyst", "recommendation", "portfolio", "trading", "invest",
    "equity", "fund", "etf", "option", "bond", "crypto", "bitcoin",
    "ipo", "sensex", "nifty", "dow", "s&p", "futures",
}
_WEB_SEARCH_KEYWORDS = {
    "news", "latest", "recent", "search", "today", "current events",
    "who is", "what is", "when was", "where is", "how does", "why does",
    "explain", "history", "definition", "weather", "trending",
    "blog", "article", "website", "government", "policy", "election",
    "sports", "technology", "science", "health", "medicine",
}


def detect_agent(query: str) -> str:
    """
    Automatically pick the best agent based on query keywords.

    Returns one of: 'finance', 'web_search', 'multi'
    """
    lower = query.lower()
    has_finance = any(kw in lower for kw in _FINANCE_KEYWORDS)
    has_web     = any(kw in lower for kw in _WEB_SEARCH_KEYWORDS)

    if has_finance and has_web:
        return "multi"       # query needs both tools
    if has_finance:
        return "finance"
    if has_web:
        return "web_search"
    return "multi"           # default fallback — multi can handle anything


@app.get("/health")
async def health():
    """Liveness check for deployment platforms."""
    return {"status": "ok"}


@app.get("/api/chart")
async def get_chart(ticker: str, period: str = "1mo"):
    """
    Return close price history for a ticker symbol using yfinance.
    Periods accepted: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, ytd, max
    For NSE stocks append .NS (e.g. RELIANCE.NS), for BSE use .BO.
    """
    try:
        import yfinance as yf

        # Sanitize inputs
        ticker = re.sub(r'[^A-Za-z0-9.\-]', '', ticker).upper()
        if not ticker or len(ticker) > 12:
            return JSONResponse({"success": False, "error": "Invalid ticker symbol."}, status_code=400)

        VALID_PERIODS = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "ytd", "max"}
        if period not in VALID_PERIODS:
            period = "1mo"

        stock = yf.Ticker(ticker)
        hist  = stock.history(period=period)

        if hist.empty:
            return JSONResponse(
                {"success": False, "error": (
                    f"No price data found for '{ticker}'. "
                    "For NSE stocks try appending .NS (e.g. RELIANCE.NS), for BSE use .BO."
                )},
                status_code=404,
            )

        labels     = hist.index.strftime("%d %b '%y").tolist()
        closes     = [round(float(p), 2) for p in hist["Close"].tolist()]
        color      = "#4ade80" if closes[-1] >= closes[0] else "#f87171"
        change_pct = round(((closes[-1] - closes[0]) / closes[0]) * 100, 2) if closes[0] else 0.0

        try:
            currency = stock.fast_info.currency or ""
        except Exception:
            currency = ""

        return JSONResponse({
            "success":    True,
            "ticker":     ticker,
            "period":     period,
            "labels":     labels,
            "closes":     closes,
            "currency":   currency,
            "color":      color,
            "change_pct": change_pct,
        })

    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Serve the main UI page."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/api/query")
@limiter.limit("15/minute")
async def query_agent(request: Request):
    """
    Accept a JSON body with:
        { "agent": "finance" | "web_search" | "multi", "query": "..." }
    Run the selected agent and return the response.
    """
    try:
        body = await request.json()
        agent_key  = body.get("agent", "auto")
        user_query = body.get("query", "").strip()

        if not user_query:
            return JSONResponse({"success": False, "error": "Query cannot be empty."})

        if len(user_query) > MAX_QUERY_LEN:
            return JSONResponse(
                {"success": False, "error": f"Query too long. Please keep it under {MAX_QUERY_LEN} characters."},
                status_code=400,
            )

        # ── Auto-routing: pick the best agent for this query ──────────────────
        if agent_key == "auto":
            agent_key = detect_agent(user_query)

        agent = AGENT_MAP.get(agent_key)
        if not agent:
            return JSONResponse(
                {"success": False, "error": f"Unknown agent: {agent_key}"}
            )

        # ── Cache lookup ──────────────────────────────────────────────────────
        cache_key = hashlib.md5(f"{agent_key}:{user_query}".encode()).hexdigest()
        with _cache_lock:
            cached = _cache.get(cache_key)
        if cached:
            return JSONResponse({"success": True, "response": cached, "agent_used": agent_key, "cached": True})

        # Use agent.run() to get the response programmatically
        response = agent.run(user_query)

        # Extract content from RunResponse
        content = ""
        if hasattr(response, "content") and response.content:
            content = response.content
        elif hasattr(response, "messages") and response.messages:
            # Fallback: get the last assistant message
            for msg in reversed(response.messages):
                if hasattr(msg, "content") and msg.content:
                    content = msg.content
                    break
        
        if not content:
            content = str(response)

        # ── Store in cache ────────────────────────────────────────────────────
        with _cache_lock:
            _cache[cache_key] = content

        return JSONResponse({"success": True, "response": content, "agent_used": agent_key})

    except Exception as e:
        traceback.print_exc()
        error_msg = str(e)

        # ── GROQ tool_use_failed — extract LLM's natural-language reply ─────
        if "tool_use_failed" in error_msg:
            fg = _extract_failed_generation(error_msg)
            reply = fg if fg else "I wasn't able to process that request. Could you please rephrase or provide more details?"
            return JSONResponse({"success": True, "response": reply, "agent_used": agent_key})

        # ── GROQ tool-call validation error (400) ────────────────────────────
        # Happens when the LLM tries to call a tool without all required
        # parameters (e.g. calling get_current_stock_price without 'symbol').
        if "tool call validation failed" in error_msg or "missing properties" in error_msg:
            friendly = (
                "The agent tried to look up data before you provided a stock symbol or company name. "
                "Please include the stock name or ticker in your query "
                "(e.g. \"What is the stock price of Reliance?\")."
            )
            return JSONResponse(
                {"success": False, "error": friendly},
                status_code=400,
            )

        # ── Generic agent / API errors ────────────────────────────────────────
        return JSONResponse(
            {"success": False, "error": f"Agent error: {error_msg}"},
            status_code=500,
        )


# ── Voice query endpoint (STT → Agent → TTS via Sarvam AI) ─────────────────
@app.post("/api/voice")
async def voice_query(
    audio: UploadFile = File(...),
    agent: str = Form("auto"),
):
    """
    Accept a voice recording, transcribe via Sarvam Saaras v3 STT,
    run through the selected agent, and return text + Bulbul v2 TTS audio.
    """
    try:
        # ── Guard: reject empty uploads ──────────────────────────────────────
        audio_bytes = await audio.read()
        if not audio_bytes:
            return JSONResponse(
                {"success": False, "error": "No audio received. Please record something before sending."},
                status_code=400,
            )

        filename  = audio.filename or "recording.webm"
        # Sarvam rejects codec-qualified types like "audio/webm;codecs=opus" —
        # strip everything after the semicolon to get the bare MIME type.
        raw_mime  = audio.content_type or "audio/webm"
        mime_type = raw_mime.split(";")[0].strip()

        # ── 1. Speech-to-Text (Sarvam Saaras v3) ────────────────────────────
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                stt_resp = await client.post(
                    "https://api.sarvam.ai/speech-to-text",
                    headers={"api-subscription-key": sarvam_api_key},
                    files={"file": (filename, audio_bytes, mime_type)},
                    data={"model": "saaras:v3", "language_code": "unknown"},
                )
        except httpx.TimeoutException:
            return JSONResponse(
                {"success": False, "error": "Speech-to-text timed out. Please try again."},
                status_code=504,
            )
        except httpx.NetworkError as e:
            return JSONResponse(
                {"success": False, "error": f"Network error reaching Sarvam STT: {e}"},
                status_code=502,
            )

        if stt_resp.status_code == 401:
            return JSONResponse(
                {"success": False, "error": "Invalid Sarvam API key. Check your SARVAM_API_KEY in .env."},
                status_code=401,
            )
        if stt_resp.status_code == 429:
            return JSONResponse(
                {"success": False, "error": "Sarvam API rate limit reached. Please wait a moment and try again."},
                status_code=429,
            )
        if stt_resp.status_code != 200:
            # Extract the human-readable message from Sarvam's error JSON if present
            try:
                err_detail = stt_resp.json().get("error", {}).get("message", stt_resp.text)
            except Exception:
                err_detail = stt_resp.text
            return JSONResponse(
                {"success": False, "error": f"Speech-to-text failed: {err_detail}"},
                status_code=502,
            )

        transcript = stt_resp.json().get("transcript", "").strip()
        if not transcript:
            return JSONResponse(
                {"success": False, "error": "Could not hear anything. Please speak clearly and try again."},
                status_code=422,
            )

        # ── 2. Run through agent ─────────────────────────────────────────────
        agent_key = agent
        if agent_key == "auto":
            agent_key = detect_agent(transcript)

        agent_obj = AGENT_MAP.get(agent_key)
        if not agent_obj:
            return JSONResponse(
                {"success": False, "error": f"Unknown agent: {agent_key}"},
                status_code=400,
            )

        try:
            response = agent_obj.run(transcript)
        except Exception as agent_err:
            err_msg = str(agent_err)
            if "tool_use_failed" in err_msg:
                fg = _extract_failed_generation(err_msg)
                reply = fg if fg else "I wasn't able to process that request. Could you please rephrase or provide more details?"
                return JSONResponse({
                    "success":    True,
                    "transcript": transcript,
                    "response":   reply,
                    "audio_b64":  None,
                    "tts_notice": None,
                    "agent_used": agent_key,
                })
            if "tool call validation failed" in err_msg or "missing properties" in err_msg:
                return JSONResponse(
                    {"success": False, "error": (
                        "The agent tried to look up data before getting a stock symbol. "
                        "Try saying something like: 'What is the stock price of Reliance?'"
                    )},
                    status_code=400,
                )
            traceback.print_exc()
            return JSONResponse(
                {"success": False, "error": f"Agent error: {agent_err}"},
                status_code=500,
            )

        content = ""
        if hasattr(response, "content") and response.content:
            content = response.content
        elif hasattr(response, "messages") and response.messages:
            for msg in reversed(response.messages):
                if hasattr(msg, "content") and msg.content:
                    content = msg.content
                    break
        if not content:
            content = str(response)

        # ── 3. Text-to-Speech (Sarvam Bulbul v2) ────────────────────────────
        # Strip markdown symbols and limit to 500 chars for clean TTS
        clean     = re.sub(r'[#*`_~>|\[\]()!]', '', content)
        clean     = re.sub(r'\n+', ' ', clean).strip()
        tts_input = clean[:500]

        audio_b64  = None
        tts_notice = None
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                tts_resp = await client.post(
                    "https://api.sarvam.ai/text-to-speech",
                    headers={
                        "api-subscription-key": sarvam_api_key,
                        "Content-Type": "application/json",
                    },
                    json={
                        "inputs": [tts_input],
                        "target_language_code": "en-IN",
                        "speaker": "meera",
                        "model": "bulbul:v2",
                        "pitch": 0,
                        "pace": 1.0,
                        "loudness": 1.5,
                        "speech_sample_rate": 22050,
                        "enable_preprocessing": True,
                    },
                )
            if tts_resp.status_code == 200:
                audio_b64 = tts_resp.json().get("audios", [None])[0]
            elif tts_resp.status_code == 429:
                tts_notice = "Audio reply unavailable (rate limit). Showing text response."
            else:
                tts_notice = "Audio reply unavailable. Showing text response."
        except httpx.TimeoutException:
            tts_notice = "Audio reply timed out. Showing text response."
        except httpx.NetworkError:
            tts_notice = "Audio reply unavailable (network error). Showing text response."
        except Exception as tts_err:
            tts_notice = f"Audio reply unavailable: {tts_err}"

        return JSONResponse({
            "success":    True,
            "transcript": transcript,
            "response":   content,
            "audio_b64":  audio_b64,
            "tts_notice": tts_notice,   # non-fatal TTS warning, shown in UI if set
            "agent_used": agent_key,
        })

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            {"success": False, "error": f"Unexpected voice error: {e}"},
            status_code=500,
        )


# ── Run with: python app.py ─────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
