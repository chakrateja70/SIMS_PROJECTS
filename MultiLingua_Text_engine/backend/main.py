from contextlib import asynccontextmanager
from pathlib import Path
import uvicorn
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from src.routes import router
from src.services.audio_service import SarvamClient


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.sarvam_client = SarvamClient()
    except Exception:
        app.state.sarvam_client = None

    yield

    client = getattr(app.state, "sarvam_client", None)
    if client is not None:
        client.close()


app = FastAPI(
    title="TTS Translation API",
    version="1.0.0",
    description="Speech-to-text, translation, and text-to-speech endpoints.",
    lifespan=lifespan,
)
app.include_router(router)

_STATIC_DIR = Path(__file__).resolve().parent / "backend" / "src" / "static"
if _STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=_STATIC_DIR), name="static")


@app.get("/", include_in_schema=False)
async def ui():
    if _STATIC_DIR.exists():
        return FileResponse(_STATIC_DIR / "index.html")
    return {"message": "UI files not found. Place frontend files in backend/src/static."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
