from src.config.settings import Settings

_SCRIPT_RANGES: list[tuple[int, int, str]] = [
    (0x0900, 0x097F, "hi-IN"),  # Devanagari → Hindi / Marathi
    (0x0980, 0x09FF, "bn-IN"),  # Bengali
    (0x0A00, 0x0A7F, "pa-IN"),  # Gurmukhi  → Punjabi
    (0x0A80, 0x0AFF, "gu-IN"),  # Gujarati
    (0x0B00, 0x0B7F, "od-IN"),  # Odia
    (0x0B80, 0x0BFF, "ta-IN"),  # Tamil
    (0x0C00, 0x0C7F, "te-IN"),  # Telugu
    (0x0C80, 0x0CFF, "kn-IN"),  # Kannada
    (0x0D00, 0x0D7F, "ml-IN"),  # Malayalam
]
_SCRIPT_LO = _SCRIPT_RANGES[0][0]   # 0x0900
_SCRIPT_HI = _SCRIPT_RANGES[-1][1]  # 0x0D7F


def detect_language(text: str) -> str:
    """
    Detect language from Unicode script ranges.
    Returns a BCP-47 code (e.g. 'hi-IN'). Defaults to 'en-IN' for Latin/unknown.
    """
    if not text or not text.strip():
        return "en-IN"
    counts: dict[str, int] = {}
    for ch in text:
        cp = ord(ch)
        if cp < _SCRIPT_LO or cp > _SCRIPT_HI:  # fast skip for ASCII / Latin
            continue
        for low, high, lang in _SCRIPT_RANGES:
            if low <= cp <= high:
                counts[lang] = counts.get(lang, 0) + 1
                break
    return max(counts, key=lambda lang: counts[lang]) if counts else "en-IN"


def bcp47_to_iso(code: str) -> str:
    """Convert BCP-47 code (e.g. 'hi-IN') to ISO 639-1 (e.g. 'hi')."""
    return code.split("-")[0].lower()


def is_supported(code: str) -> bool:
    """Return True if the BCP-47 code is in the supported language map."""
    return code in Settings.SUPPORTED_LANGUAGES