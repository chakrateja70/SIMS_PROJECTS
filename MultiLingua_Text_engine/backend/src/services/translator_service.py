import logging
from deep_translator import GoogleTranslator
from deep_translator.exceptions import LanguageNotSupportedException, TranslationNotFound
from src.core.exceptions import SarvamError, TranslationError
from src.utils.language import bcp47_to_iso

logger = logging.getLogger(__name__)


class TranslationService:
    """
    Translates text using Sarvam mayura:v1 as primary,
    falling back to deep-translator (Google Translate) on failure.
    Returns (translated_text, engine_name).
    """

    def __init__(self, client, fallback: bool = True):
        self._client = client
        self._fallback = fallback

    def translate(self, text: str, source_lang: str, target_lang: str) -> tuple[str, str]:
        try:
            result = self._client.translate(text, source_lang, target_lang)
            return result, "sarvam"
        except SarvamError as primary_err:
            if not self._fallback:
                raise TranslationError(str(primary_err)) from primary_err
            logger.warning("Sarvam translate failed (%s). Trying deep-translator...", primary_err)

        # Fallback: deep-translator 
        src_iso = bcp47_to_iso(source_lang)
        tgt_iso = bcp47_to_iso(target_lang)
        try:
            result = GoogleTranslator(source=src_iso, target=tgt_iso).translate(text)
            if not result:
                raise TranslationError("deep-translator returned an empty response.")
            return result, "deep-translator"
        except (LanguageNotSupportedException, TranslationNotFound) as e:
            raise TranslationError(f"deep-translator: language error — {e}") from e
        except TranslationError:
            raise
        except Exception as e:
            raise TranslationError(f"Both Sarvam and deep-translator failed: {e}") from e