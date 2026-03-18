from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.db.database import init_db
from src.routes import router

app = FastAPI(
    title       = "DMart Receipt Analyser",
    description = "Upload DMart receipts → OCR → Groq LLM extraction → Neon DB",
    version     = "2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


app.include_router(router)
