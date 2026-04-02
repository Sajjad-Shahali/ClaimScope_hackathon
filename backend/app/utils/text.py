import re
import unicodedata


def normalize_text(value: str | None) -> str | None:
    """Normalize whitespace and casing for categorical text values."""
    if value is None:
        return None
    normalized = unicodedata.normalize("NFKC", str(value)).strip()
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.upper() if normalized else None
