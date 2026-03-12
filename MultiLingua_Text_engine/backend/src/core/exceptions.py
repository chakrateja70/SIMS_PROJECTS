from fastapi import HTTPException
from starlette.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_415_UNSUPPORTED_MEDIA_TYPE,
    HTTP_422_UNPROCESSABLE_ENTITY,
    HTTP_502_BAD_GATEWAY,
    HTTP_503_SERVICE_UNAVAILABLE,
)

# Centralized status messages
STATUS_MESSAGES = {
    HTTP_400_BAD_REQUEST: "Bad Request",
    HTTP_415_UNSUPPORTED_MEDIA_TYPE: "Unsupported Media Type",
    HTTP_422_UNPROCESSABLE_ENTITY: "Unprocessable Entity",
    HTTP_502_BAD_GATEWAY: "Bad Gateway",
    HTTP_503_SERVICE_UNAVAILABLE: "Service Unavailable",
}

class BaseAPIException(HTTPException):
    """Base exception class for all API exceptions."""
    def __init__(self, status_code: int, status_message: str, error_message: str):
        super().__init__(
            status_code=status_code,
            detail={
                "statusCode": status_code,
                "statusMessage": status_message,
                "errorMessage": error_message,
            }
        )

class SarvamError(BaseAPIException):
    """Raised when a Sarvam API call fails (generic upstream error)."""
    def __init__(self, error_message: str):
        super().__init__(
            status_code=HTTP_502_BAD_GATEWAY,
            status_message=STATUS_MESSAGES[HTTP_502_BAD_GATEWAY],
            error_message=error_message,
        )


class STTError(SarvamError):
    """Raised when the Sarvam Speech-to-Text (STT) call fails."""
    def __init__(self, error_message: str):
        super().__init__(error_message = error_message)


class TTSError(SarvamError):
    """Raised when the Sarvam Text-to-Speech (TTS) call fails."""
    def __init__(self, error_message: str):
        super().__init__(error_message = error_message)


class TranslationError(SarvamError):
    """Raised when all translation attempts (Sarvam + deep-translator fallback) fail."""
    def __init__(self, error_message: str):
        super().__init__(error_message = error_message)

class LanguageNotSupportedError(BaseAPIException):
    """Raised when a BCP-47 language code is not in the supported languages list."""
    def __init__(self, lang_code: str):
        super().__init__(
            status_code=HTTP_400_BAD_REQUEST,
            status_message=STATUS_MESSAGES[HTTP_400_BAD_REQUEST],
            error_message=f"Language '{lang_code}' is not supported. Use GET /languages for the full list.",
        )


class InvalidInputError(BaseAPIException):
    """Raised for malformed or missing request input."""
    def __init__(self, error_message: str):
        super().__init__(
            status_code=HTTP_400_BAD_REQUEST,
            status_message=STATUS_MESSAGES[HTTP_400_BAD_REQUEST],
            error_message=error_message,
        )


class EmptyAudioError(InvalidInputError):
    """Raised when an uploaded audio file contains no data."""
    def __init__(self, error_message: str = "Uploaded audio file is empty."):
        super().__init__(error_message)


class MissingAudioSourceError(InvalidInputError):
    """Raised when neither an audio file nor the microphone flag is provided."""
    def __init__(
        self,
        error_message: str = "Provide an audio file via 'file' field, or enable 'use_microphone'.",
    ):
        super().__init__(error_message)

class UnsupportedMediaTypeError(BaseAPIException):
    """Raised when the uploaded audio file has an unsupported MIME type."""
    def __init__(self, error_message: str):
        super().__init__(
            status_code=HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            status_message=STATUS_MESSAGES[HTTP_415_UNSUPPORTED_MEDIA_TYPE],
            error_message=error_message,
        )


class EmptyTranscriptError(BaseAPIException):
    """Raised when the STT engine returns an empty or blank transcript."""
    def __init__(self, error_message: str = "Empty transcript returned."):
        super().__init__(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            status_message=STATUS_MESSAGES[HTTP_422_UNPROCESSABLE_ENTITY],
            error_message=error_message,
        )

class MicrophoneError(BaseAPIException):
    """Raised when the server microphone is not accessible."""
    def __init__(self, error_message: str):
        super().__init__(
            status_code=HTTP_503_SERVICE_UNAVAILABLE,
            status_message=STATUS_MESSAGES[HTTP_503_SERVICE_UNAVAILABLE],
            error_message=error_message,
        )


class ClientNotConfiguredError(BaseAPIException):
    """Raised when the Sarvam API client has not been initialised on app startup."""
    def __init__(self, error_message: str = "Sarvam client is not configured."):
        super().__init__(
            status_code=HTTP_503_SERVICE_UNAVAILABLE,
            status_message=STATUS_MESSAGES[HTTP_503_SERVICE_UNAVAILABLE],
            error_message=error_message,
        )

