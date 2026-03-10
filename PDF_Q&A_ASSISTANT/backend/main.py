import uvicorn
from fastapi import FastAPI
from src.routes import router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="rag_chatbot",
    description="A RAG-based chatbot, utilizing Groq LLM for comprehensive legal analysis and responses.",
    version="1.0.0"
)
app.include_router(router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)