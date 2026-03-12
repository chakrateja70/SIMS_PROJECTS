import io
import requests
from src.config.settings import settings
from src.core.exceptions import SarvamError, STTError, TTSError


_TRANSLATE_MODEL_ALIASES: dict[str, str] = {
    "mayura": "mayura:v1",
    "mayura:v1": "mayura:v1",
    "sarvam-translate": "sarvam-translate:v1",
    "sarvam-translate:v1": "sarvam-translate:v1",
    "sarrvam-translate": "sarrvam-translate:v1",
    "sarrvam-translate:v1": "sarrvam-translate:v1",
}

_TTS_MODEL_ALIASES: dict[str, str] = {
    "bulbul": "bulbul:v2",
    "bulbul:v2": "bulbul:v2",
    "bulbul:v3": "bulbul:v2",
    "sarrika": "bulbul:v2",
}

_TTS_SPEAKER_ALIASES: dict[str, str] = {
    "meera": "anushka",
    "arvind": "abhilash",
}


def _resolve(aliases: dict[str, str], value: str) -> str:
    return aliases.get((value or "").strip().lower(), value)


class SarvamClient:
    def __init__(self):
        if not settings.SARVAM_API_KEY:
            raise ValueError("SARVAM_API_KEY is not set.")
        self._base = settings.SARVAM_BASE_URL.rstrip("/")
        if "localhost:8000" in self._base or "127.0.0.1:8000" in self._base:
            raise ValueError(
                "SARVAM_BASE_URL points to the local app server. "
                "Use the Sarvam endpoint (local server link)."
            )
        self._session = requests.Session()
        self._session.headers["api-subscription-key"] = settings.SARVAM_API_KEY
        # Cache resolved defaults once — avoids repeated dict lookups per request
        self._translate_model = _resolve(_TRANSLATE_MODEL_ALIASES, settings.TRANSLATE_MODEL)
        self._tts_model = _resolve(_TTS_MODEL_ALIASES, settings.TTS_MODEL)
        self._default_speaker = _resolve(_TTS_SPEAKER_ALIASES, settings.TTS_SPEAKER)

    def _check(self, response: requests.Response, label: str) -> None:
        if response.ok:
            return
        try:
            detail = response.json()
        except ValueError:
            detail = response.text
        raise SarvamError(f"{label} failed ({response.status_code}): {detail}")

    # STT

    def speech_to_text(self, audio_bytes: bytes, language_code: str = "unknown") -> str:
        try:
            resp = self._session.post(
                f"{self._base}/speech-to-text",
                files={"file": ("audio.wav", io.BytesIO(audio_bytes), "audio/wav")},
                data={"model": settings.STT_MODEL, "language_code": language_code},
                timeout=60,
            )
            self._check(resp, "STT")
            return resp.json().get("transcript", "")
        except SarvamError:
            raise
        except Exception as e:
            raise STTError(f"STT request failed: {e}") from e

    # Translate

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        try:
            resp = self._session.post(
                f"{self._base}/translate",
                json={
                    "input": text,
                    "source_language_code": source_lang,
                    "target_language_code": target_lang,
                    "model": self._translate_model,
                    "enable_preprocessing": True,
                },
                timeout=30,
            )
            self._check(resp, "Translate")
            return resp.json().get("translated_text", "")
        except SarvamError:
            raise
        except Exception as e:
            raise SarvamError(f"Translate request failed: {e}") from e

    # TTS

    def text_to_speech(
        self,
        text: str,
        target_lang: str,
        speaker: str | None = None,
        pace: float | None = None,
        speech_sample_rate: int | None = None,
        output_audio_codec: str | None = None,
    ) -> bytes:
        try:
            resolved_speaker = _resolve(_TTS_SPEAKER_ALIASES, speaker) if speaker else self._default_speaker
            resp = self._session.post(
                f"{self._base}/text-to-speech/stream",
                json={
                    "text": text,
                    "target_language_code": target_lang,
                    "model": self._tts_model,
                    "speaker": resolved_speaker,
                    "pace": pace if pace is not None else settings.TTS_PACE,
                    "speech_sample_rate": (
                        speech_sample_rate if speech_sample_rate is not None else settings.TTS_SAMPLE_RATE
                    ),
                    "output_audio_codec": output_audio_codec or settings.TTS_CODEC,
                    "enable_preprocessing": True,
                },
                timeout=60,
                stream=True,
            )
            self._check(resp, "TTS")

            audio = b"".join(filter(None, resp.iter_content(chunk_size=8192)))
            if not audio:
                raise TTSError("TTS returned empty audio stream.")
            return audio
        except SarvamError:
            raise
        except Exception as e:
            raise TTSError(f"TTS request failed: {e}") from e

    def close(self):
        self._session.close()