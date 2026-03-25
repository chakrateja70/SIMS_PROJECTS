# FinAgent — Financial AI Assistant

A multi-agent AI system with a full web UI, voice input/output, live stock charts, and smart query routing. Built with **FastAPI**, **Phidata**, **Groq LLMs**, **Yahoo Finance**, and **Sarvam AI**.

---

## Features

- **3 AI Agents** — Finance, Web Search, and Multi Agent with auto smart routing
- **Live Stock Data** — prices, fundamentals, analyst recommendations, company news
- **Inline Charts** — interactive price history charts rendered directly in chat
- **Voice Input/Output** — speak your query (Sarvam STT) and hear the response (Sarvam TTS)
- **Chat History** — persisted in browser localStorage across sessions
- **Watchlist** — save tickers in the sidebar for quick access
- **Follow-up Chips** — suggested next queries after each response
- **Rate Limiting** — 15 requests/min on the query endpoint
- **Response Cache** — identical queries served from cache (5 min TTL)
- **PWA Support** — installable as a desktop/mobile app

---

## Project Structure

```
financial_agent/
├── app.py                  # FastAPI server — routes, cache, rate limiting
├── main.py                 # CLI entry point (legacy)
├── queries.py              # Example queries
├── requirements.txt
├── .env                    # API keys (not committed)
├── agents/
│   ├── finance_agent.py    # YFinance agent (stock data)
│   ├── web_search_agent.py # DuckDuckGo agent (web search)
│   └── multi_agent.py      # Combined agent (finance + web)
├── templates/
│   └── index.html          # Web UI (single page)
└── static/
    ├── style.css
    ├── manifest.json       # PWA manifest
    ├── sw.js               # Service worker
    └── icon-192.png / icon-512.png
```

---

## Setup

### 1. Create a Virtual Environment (Python 3.11)

```bash
py -3.11 -m venv venv
```

### 2. Activate the Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```
**macOS / Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure API Keys

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
SARVAM_API_KEY=your_sarvam_api_key_here
```

| Key | Where to get it |
|---|---|
| `GROQ_API_KEY` | https://console.groq.com |
| `SARVAM_API_KEY` | https://app.sarvam.ai |

### 5. Start the Server

```bash
python app.py
```

Then open **http://127.0.0.1:8000** in your browser.

---

## Agents

| Agent | Model | Tools | Best for |
|---|---|---|---|
| **Finance Agent** | `llama-3.3-70b-versatile` | YFinance | Stock prices, fundamentals, analyst ratings, company news |
| **Web Search Agent** | `llama-3.3-70b-versatile` | DuckDuckGo | Latest news, general questions, web search |
| **Multi Agent** | `llama-4-scout-17b-16e-instruct` | YFinance + DuckDuckGo | Queries needing both finance data and web search |
| **Auto (Smart Routing)** | — | Picks best agent | Automatically routes to the right agent based on your query |

### How Auto Routing Works

| Query contains | Routed to |
|---|---|
| "stock", "price", "NSE", "dividend", "Nifty", etc. | Finance Agent |
| "news", "latest", "explain", "what is", etc. | Web Search Agent |
| Both finance + web keywords | Multi Agent |
| Neither (fallback) | Multi Agent |

---

## Using Charts

Type any message with a chart keyword and a stock ticker — a chart renders inline in the chat.

```
Show AAPL chart
Plot RELIANCE.NS graph
TCS.NS price history 3 months
HDFCBANK.NS chart 1 year
```

Period keywords supported: `1 week`, `3 months`, `6 months`, `1 year`, `2 years`, `5 years`, `max`

Use the period buttons on the chart itself to switch timeframes without retyping.

---

## Indian Stocks — Ticker Rules

Yahoo Finance requires an exchange suffix for Indian stocks:

| Exchange | Suffix | Example |
|---|---|---|
| National Stock Exchange (NSE) | `.NS` | `RELIANCE.NS` |
| Bombay Stock Exchange (BSE) | `.BO` | `RELIANCE.BO` |

**Always prefer `.NS` (NSE) unless BSE data is specifically needed.**

### Common Tickers

| Company | NSE Ticker |
|---|---|
| Reliance Industries | `RELIANCE.NS` |
| Tata Consultancy Services | `TCS.NS` |
| Infosys | `INFY.NS` |
| HDFC Bank | `HDFCBANK.NS` |
| Tata Motors | `TATAMOTORS.NS` |
| Wipro | `WIPRO.NS` |
| State Bank of India | `SBIN.NS` |
| ITC | `ITC.NS` |

The agents automatically resolve Indian company names to the correct `.NS` ticker before querying.

---

## Voice Input / Output

1. Click the **microphone button** in the input bar
2. Speak your query in English
3. Click the mic again to stop recording
4. The agent processes the transcript and plays back a voice response (Sarvam Bulbul TTS)

> Voice uses Sarvam AI — requires a valid `SARVAM_API_KEY` in `.env`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Web UI |
| `POST` | `/api/query` | Text query → agent response |
| `POST` | `/api/voice` | Audio upload → STT |
| `GET` | `/api/chart?ticker=AAPL&period=1mo` | Price history data for charts |
| `GET` | `/health` | Server liveness check |