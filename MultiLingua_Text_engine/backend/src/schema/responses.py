from typing import Optional
from pydantic import AliasChoices, BaseModel, Field, RootModel

LANG_FIELD = Field(
    None,
    validation_alias=AliasChoices("source_lang", "source_language_code"),
    description="BCP-47 language code, or omit/null/auto/unknown for auto-detect.",
)
TARGET_LANG_FIELD = Field(
    None,
    validation_alias=AliasChoices("target_lang", "target_language_code"),
    description="BCP-47 target language, or omit/null/auto/same/source to keep source.",
)


class TranslateRequest(BaseModel):
    text: str = Field(
        ...,
        validation_alias=AliasChoices("text", "input"),
        description="Input text to translate.",
    )
    source_lang: Optional[str] = LANG_FIELD
    target_lang: Optional[str] = TARGET_LANG_FIELD

    model_config = {"json_schema_extra": {"example": {
        "text": "नमस्ते, आप कैसे हैं?",
        "target_lang": "ta-IN",
    }}}


class TTSRequest(BaseModel):
    text: str = Field(..., description="Text to synthesise.")
    source_lang: Optional[str] = LANG_FIELD
    target_lang: Optional[str] = TARGET_LANG_FIELD
    speaker: Optional[str] = Field(None, description="Speaker voice name (e.g. meera, arvind).")
    pace: Optional[float] = Field(None, ge=0.5, le=2.0, description="Speech pace multiplier.")
    speech_sample_rate: Optional[int] = Field(None, ge=8000, le=48000, description="Output sample rate in Hz.")
    output_audio_codec: Optional[str] = Field(None, description="Output codec: mp3 | wav | pcm.")

    model_config = {"json_schema_extra": {"example": {
        "text": "नमस्ते दुनिया",
        "target_lang": "ta-IN",
        "speaker": "meera",
        "pace": 1.1,
        "speech_sample_rate": 22050,
        "output_audio_codec": "mp3",
    }}}


class LanguagesResponse(RootModel[dict[str, str]]):
    """Returned by GET /languages — mapping of BCP-47 code → language name."""
    model_config = {"json_schema_extra": {"example": {
        "hi-IN": "Hindi",
        "ta-IN": "Tamil",
        "te-IN": "Telugu",
        "en-IN": "English (India)",
    }}}

class TranslateResponse(BaseModel):
    """Returned by POST /translate."""
    source_lang: str = Field(..., description="Detected or provided source language code.")
    target_lang: str = Field(..., description="Target language code.")
    original_text: str = Field(..., description="Input text as received.")
    translated_text: str = Field(..., description="Translated (or pass-through) text.")
    skipped_translation: bool = Field(..., description="True when source == target (pass-through).")
    engine: str = Field(..., description="Translation engine used: 'sarvam', 'deep-translator', or 'none'.")


class APIErrorDetail(BaseModel):
    statusCode: int = Field(..., description="HTTP status code.")
    statusMessage: str = Field(..., description="HTTP status message.")
    errorMessage: str = Field(..., description="Human-readable description of the error.")


class APIErrorResponse(BaseModel):
    """Unified error envelope returned by all API exception classes."""
    detail: APIErrorDetail

    model_config = {"json_schema_extra": {"example": {
        "detail": {
            "statusCode": 502,
            "statusMessage": "Bad Gateway",
            "errorMessage": "STT request failed: connection timeout",
        }
    }}}
