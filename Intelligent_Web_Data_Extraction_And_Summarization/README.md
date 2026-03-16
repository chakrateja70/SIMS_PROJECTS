# Intelligent Web Data Extraction and Summarization

This project extracts web content using scrape/crawl workflows and generates focused summaries using Groq LLMs.

## Backend Setup

1. **Create and activate a virtual environment:**
	```sh
	cd backend
	python -m venv venv
	venv\Scripts\activate   # On Windows
	source venv/bin/activate # On macOS/Linux
	```

2. **Install dependencies:**
	```sh
	pip install -r requirements.txt
	```

3. **Configure environment variables:**
	- Create a `.env` file inside `backend/` and set:
	  - `HYPERBROWSER_API_KEY`
	  - `GROQ_API_KEY`

4. **Start backend server:**
	```sh
	uvicorn main:app --reload --host 0.0.0.0 --port 8000
	```
	- Backend runs on port `8000` by default.

---

## Frontend Setup

1. **Install dependencies:**
	```sh
	cd frontend
	npm install
	```

2. **Configure backend base URL:**
	- Create a `.env` file inside `frontend/` and set:
	  - `BACKEND_URL="http://127.0.0.1:8000"`

3. **Start frontend:**
	```sh
	npm run dev
	```
	- Frontend runs on port `3001` (configured in Next.js dev script).

---

## API Endpoints (Backend)

- `POST /crawl`: Crawl multiple pages from a seed URL and return markdown results.
- `POST /scrape`: Scrape a single page and return markdown content.
- `POST /summarize`: Scrape or crawl a URL and return an LLM-generated summary.

---

## Tech Stack

- **Backend:** FastAPI, Uvicorn, Python
- **LLM:** Groq (via OpenAI-compatible API)
- **Web extraction:** LangChain Hyperbrowser tooling
- **Frontend:** Next.js, React, TypeScript, Tailwind CSS

---

## Configuration Notes

- Backend settings are loaded from environment variables at startup.
- If backend startup fails with missing keys, verify `backend/.env` has required values.
- The frontend proxies requests to the backend using `BACKEND_URL`.
- If `BACKEND_URL` is not set, frontend falls back to `http://127.0.0.1:8000`.

---

## Useful Links

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Groq Documentation](https://console.groq.com/docs)
