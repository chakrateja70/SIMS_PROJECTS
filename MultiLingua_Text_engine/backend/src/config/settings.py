import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")


class Settings:
    SARVAM_API_KEY: str     = os.getenv("SARVAM_API_KEY", "")
    SARVAM_BASE_URL: str    = os.getenv("SARVAM_BASE_URL", "https://api.sarvam.ai")
    STT_MODEL: str          = os.getenv("SARVAM_STT_MODEL", "saarika:v2")
    TRANSLATE_MODEL: str    = os.getenv("SARVAM_TRANSLATE_MODEL", "mayura:v1")
    TTS_MODEL: str          = os.getenv("SARVAM_TTS_MODEL", "bulbul:v2")
    DEFAULT_TARGET_LANG: str = os.getenv("DEFAULT_TARGET_LANG", "hi-IN")
    TTS_SPEAKER: str        = os.getenv("TTS_SPEAKER", "meera")
    TTS_PACE: float         = float(os.getenv("TTS_PACE", "1.1"))
    TTS_SAMPLE_RATE: int    = int(os.getenv("TTS_SAMPLE_RATE", "22050"))
    TTS_CODEC: str          = os.getenv("TTS_CODEC", "mp3")
    OUTPUT_DIR: str         = os.getenv("OUTPUT_DIR", "output")

    SUPPORTED_LANGUAGES: dict = {
        "hi-IN": "Hindi",
        "bn-IN": "Bengali",
        "ta-IN": "Tamil",
        "te-IN": "Telugu",
        "mr-IN": "Marathi",
        "gu-IN": "Gujarati",
        "kn-IN": "Kannada",
        "ml-IN": "Malayalam",
        "pa-IN": "Punjabi",
        "od-IN": "Odia",
        "en-IN": "English (India)",
    }


settings = Settings()