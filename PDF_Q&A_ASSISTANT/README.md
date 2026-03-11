# PDF Q&A Assistant

## Backend Setup

1. Create and activate a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate   # On Windows
   source venv/bin/activate # On macOS/Linux
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure Pinecone and Groq API keys:
   - Set `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, and `PINECONE_NAMESPACE` in your environment or `settings.py`.
   - Set `GROQ_API_KEY` in your environment or `settings.py` for LLM access.
   - Get your Pinecone API key from [Pinecone Console](https://app.pinecone.io/).
   - Get your Groq API key from [Groq Console](https://console.groq.com/).
4. Start backend server:
   ```bash
   uvicorn main:app --reload
   ```

## Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start frontend:
   ```bash
   npm run dev
   ```

## Configuration Notes
- Backend runs on port 8000 by default.
- Frontend uses Vite and proxies API requests to backend.
- Pinecone API keys are required for vector database functionality.

## Useful Links
- [Pinecone Documentation](https://docs.pinecone.io/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
