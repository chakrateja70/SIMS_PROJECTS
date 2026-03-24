import io
from typing import Optional, cast
import sounddevice as sd
import soundfile as sf
from fastapi import Request
from src.config.settings import settings
from src.core.exceptions import ClientNotConfiguredError, LanguageNotSupportedError
from src.services.translator_service import TranslationService
from src.utils.language import detect_language, is_supported

SAMPLE_RATE = 16000  # 16 kHz expected by STT

ALLOWED_AUDIO = {
    "audio/wav", "audio/wave", "audio/x-wav",
    "audio/mpeg", "audio/mp3",
    "audio/ogg", "video/ogg", "application/ogg",
    "audio/webm",
    "application/octet-stream",
}

_CODEC_MAP: dict[str, tuple[str, str]] = {
    "mp3": ("audio/mpeg", "mp3"),
    "wav": ("audio/wav", "wav"),
    "pcm": ("audio/L16", "pcm"),
}


def audio_response_meta(codec: str) -> tuple[str, str]:
    return _CODEC_MAP.get(codec.lower(), ("application/octet-stream", codec.lower()))


def resolve_codec(preferred: str | None) -> str:
    return (preferred or settings.TTS_CODEC).lower()


def get_client(request: Request):
    client = getattr(request.app.state, "sarvam_client", None)
    if client is None:
        raise ClientNotConfiguredError()
    return client


def translate_if_needed(
    client,
    text: str,
    source_lang: Optional[str],
    target_lang: Optional[str],
) -> tuple[str, str, str, bool, str]:
    """Translate text if source and target languages differ.

    Returns (translated, src, tgt, skipped, engine).
    """
    normalized = (source_lang or "").strip().lower()
    if normalized in {"", "auto", "unknown", "detect"}:
        src = detect_language(text)
    else:
        src = cast(str, source_lang)

    target_norm = (target_lang or "").strip().lower()
    if target_norm in {"", "auto", "unknown", "detect", "same", "source"}:
        tgt = src
    else:
        tgt = cast(str, target_lang)
        if not is_supported(tgt):
            raise LanguageNotSupportedError(tgt)

    if src.lower() == tgt.lower():
        return text, src, tgt, True, "none"
    translated, engine = TranslationService(client).translate(text, src, tgt)
    return translated, src, tgt, False, engine


def record_from_microphone(seconds: int) -> bytes:
    """Record audio from the system microphone and return WAV bytes."""
    audio = sd.rec(int(seconds * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1, dtype="int16")
    sd.wait()
    buf = io.BytesIO()
    sf.write(buf, audio, SAMPLE_RATE, format="WAV", subtype="PCM_16")
    return buf.getvalue()


