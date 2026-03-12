# MultiLingua Text Engine

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
	- Copy `.env.example` to `.env` and fill in your values:
	  - `SARVAM_API_KEY`
	  - `SARVAM_BASE_URL`
	  - `SARVAM_STT_MODEL`
	  - `SARVAM_TRANSLATE_MODEL`
	  - `SARVAM_TTS_MODEL`
	  - `DEFAULT_TARGET_LANG`
	  - `TTS_SPEAKER`
	  - `TTS_PITCH`
    - Get your Sarvam API key from [sarvam](https://www.sarvam.ai/).

4. **Start backend server:**
	```sh
	uvicorn main:app --reload
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
	- Copy `.env.example` to `.env` and set:
	  - `BACKEND_BASE_URL="http://localhost:8000"` (or your backend URL)

3. **Start frontend:**
	```sh
	npm run dev
	```
	- Frontend runs on port `3000` by default (Next.js).

---

## Configuration Notes

- The backend is built with FastAPI and serves speech-to-text, translation, and text-to-speech endpoints.
- The frontend is built with Next.js, TypeScript, and Tailwind CSS.
- The frontend communicates with the backend using the `BACKEND_BASE_URL` environment variable.
- Place any static frontend files in `backend/src/static` if you want them served by the backend.
---

## Useful Links

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
