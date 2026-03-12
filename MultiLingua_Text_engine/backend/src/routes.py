import base64
import io
import logging
from typing import Annotated, Optional
from fastapi import APIRouter, File, Form, Request, UploadFile
from fastapi.responses import StreamingResponse
from src.config.settings import settings
from src.core.exceptions import (
    EmptyAudioError,
    EmptyTranscriptError,
    MicrophoneError,
    MissingAudioSourceError,
    UnsupportedMediaTypeError,
)
from src.schema.responses import (
    APIErrorResponse,
    LanguagesResponse,
    TranslateRequest,
    TranslateResponse,
    TTSRequest,
)
from src.utils.helpers import (
    get_client,
    record_from_microphone,
    translate_if_needed,
    audio_response_meta,
    resolve_codec,
    ALLOWED_AUDIO,
)

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get(
    "/languages",
    tags=["Meta"],
    summary="List supported languages",
    response_model=LanguagesResponse,
)
def languages():
    return settings.SUPPORTED_LANGUAGES


# Text → Text 

@router.post(
    "/translate",
    response_model=TranslateResponse,
    tags=["Text-to-Text"],
    summary="Translate text (same language returns original, different language translates)",
    responses={
        400: {"model": APIErrorResponse, "description": "Invalid input or unsupported language code"},
        502: {"model": APIErrorResponse, "description": "Sarvam or fallback translation upstream error"},
        503: {"model": APIErrorResponse, "description": "Sarvam client not configured"},
    },
)
async def translate(body: TranslateRequest, request: Request):
    client = get_client(request)
    translated, src, tgt, skipped, engine = translate_if_needed(
        client, body.text, body.source_lang, body.target_lang
    )
    return TranslateResponse(
        source_lang=src,
        target_lang=tgt,
        original_text=body.text,
        translated_text=translated,
        skipped_translation=skipped,
        engine=engine,
    )


#  Text → Speech 

@router.post(
    "/tts",
    tags=["Text-to-Speech"],
    summary="Translate text then synthesise streaming speech audio (same or different language)",
    responses={
        200: {"content": {"audio/mpeg": {}, "audio/wav": {}}, "description": "Audio stream"},
        400: {"model": APIErrorResponse, "description": "Invalid input or unsupported language code"},
        502: {"model": APIErrorResponse, "description": "TTS or translation upstream error"},
        503: {"model": APIErrorResponse, "description": "Sarvam client not configured"},
    },
)
async def tts(body: TTSRequest, request: Request):
    client = get_client(request)
    translated, _, tgt, _, _ = translate_if_needed(client, body.text, body.source_lang, body.target_lang)
    codec = resolve_codec(body.output_audio_codec)
    audio_bytes = client.text_to_speech(
        translated,
        tgt,
        speaker=body.speaker,
        pace=body.pace,
        speech_sample_rate=body.speech_sample_rate,
        output_audio_codec=codec,
    )
    media_type, ext = audio_response_meta(codec)
    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="tts_{tgt}.{ext}"',
        },
    )


# Speech → Speech

@router.post(
    "/speech",
    tags=["Speech-to-Speech"],
    summary="Speech to speech: upload audio file OR record live → (translate) → TTS",
    responses={
        200: {"content": {"audio/mpeg": {}, "audio/wav": {}}, "description": "Audio stream"},
        400: {"model": APIErrorResponse, "description": "Missing/empty audio input or unsupported language code"},
        415: {"model": APIErrorResponse, "description": "Unsupported audio MIME type"},
        422: {"model": APIErrorResponse, "description": "STT returned an empty transcript"},
        502: {"model": APIErrorResponse, "description": "STT, TTS, or translation upstream error"},
        503: {"model": APIErrorResponse, "description": "Microphone unavailable or Sarvam client not configured"},
    },
)
async def speech(
    request: Request,
    file: Annotated[Optional[UploadFile], File(description="Upload an audio file (wav/mp3/ogg)")] = None,
    use_microphone: Optional[bool] = Form(default=None, description="Set to true to record live from the server microphone"),
    record_seconds: int = Form(default=5, ge=1, le=120, description="Duration in seconds for live microphone recording (1–120 s)"),
    language_hint: str = Form(default="unknown", description="BCP-47 language code of the input audio, or 'unknown' to auto-detect"),
    target_lang: Optional[str] = Form(default=None, description="Target language for output speech, e.g. hi-IN, ta-IN, te-IN (default: server setting)"),
    output_audio_codec: Optional[str] = Form(default=None, description="Output codec: mp3 | wav | pcm (default: server setting)"),
):
    if target_lang is None:
        target_lang = settings.DEFAULT_TARGET_LANG
    if output_audio_codec is None:
        output_audio_codec = settings.TTS_CODEC

    #  Acquire audio 
    if file is not None:
        if file.content_type and file.content_type.split(";")[0].strip() not in ALLOWED_AUDIO:
            raise UnsupportedMediaTypeError(f"Unsupported audio format: {file.content_type}")
        audio_bytes = await file.read()
        if not audio_bytes:
            raise EmptyAudioError()
    elif use_microphone is True:
        try:
            audio_bytes = record_from_microphone(record_seconds)
        except Exception as e:
            raise MicrophoneError(f"Microphone not accessible on this server: {e}")
    else:
        raise MissingAudioSourceError()

    client = get_client(request)

    # Speech → Text 
    transcript = client.speech_to_text(audio_bytes, language_hint)

    if not transcript:
        raise EmptyTranscriptError()

    # Translate if needed 
    hint = (language_hint or "").strip().lower()
    source_lang = None if hint in {"", "auto", "unknown", "detect"} else language_hint
    translated, src, tgt, skipped, _ = translate_if_needed(client, transcript, source_lang, target_lang)

    # Text → Speech
    codec = resolve_codec(output_audio_codec)
    output_audio = client.text_to_speech(
        translated,
        tgt,
        output_audio_codec=codec,
    )
    media_type, ext = audio_response_meta(codec)

    return StreamingResponse(
        io.BytesIO(output_audio),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="speech_{tgt}.{ext}"',
            "X-Transcript": base64.b64encode(transcript.encode()).decode("ascii"),
            "X-Transcript-Encoding": "base64",
            "X-Source-Lang": src,
            "X-Target-Lang": tgt,
            "X-Translated-Text": base64.b64encode(translated[:200].encode()).decode("ascii"),
            "X-Translated-Text-Encoding": "base64",
            "X-Skipped-Translation": str(skipped).lower(),
        },
    )