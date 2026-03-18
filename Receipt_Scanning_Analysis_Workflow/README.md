# Receipt Scanning Analysis Workflow

End-to-end receipt analysis app:
- Backend: FastAPI + OCR + Groq LLM + PostgreSQL (Neon compatible)
- Frontend: Single-page HTML/CSS/JavaScript dashboard

## Tech Stack

- FastAPI, Uvicorn
- Tesseract OCR (`pytesseract` + Pillow)
- Groq API (`groq` Python SDK)
- PostgreSQL (`psycopg2-binary`)
- Plain frontend: HTML, CSS, JavaScript (no Next.js, no npm build)

---

## Backend Setup

1. Go to backend folder:
	```sh
	cd backend
	```

2. Create and activate virtual environment:
	```sh
	python -m venv venv
	venv\Scripts\activate
	```
	On macOS/Linux:
	```sh
	source venv/bin/activate
	```

3. Install dependencies:
	```sh
	pip install -r requirements.txt
	```

4. Create `.env` in `backend/` with:
	```env
	GROQ_API_KEY=your_groq_api_key
	DATABASE_URL=your_DB_url
	```

5. Install Tesseract OCR engine (required by `pytesseract`):
	- Windows: install Tesseract and ensure it is available in your PATH.
	- macOS: `brew install tesseract`
	- Ubuntu/Debian: `sudo apt-get install tesseract-ocr`

6. Start backend server:
	```sh
	uvicorn main:app --reload
	```

Backend runs on `http://127.0.0.1:8000` by default.

---

## Frontend Setup (HTML/CSS/JS)

This frontend is a static app in `frontend/index.html`.

1. Open a new terminal and go to frontend folder:
	```sh
	cd frontend
	```

2. Run:
	```sh
	start .\index.html
	```

The frontend calls the backend using a configurable API base URL stored in browser localStorage.
Default is:
- `http://127.0.0.1:8000`

If needed, open browser DevTools console and set:
```js
localStorage.setItem('rsw_api_base', 'http://127.0.0.1:8000');
location.reload();
```

---

Swagger/OpenAPI docs:
- `http://127.0.0.1:8000/docs`
