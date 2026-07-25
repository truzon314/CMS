"""Server-side upload validation (SECURITY_CHECKLIST.md §6): the MIME type is
never trusted from the client `Content-Type` header or filename extension —
it's sniffed from the file's actual bytes. SVG is the one allowed type with no
binary magic number, so it gets its own text-based check plus sanitization.
"""

import re

import filetype

from app.core.config import get_settings
from app.core.exceptions import ValidationAppError

_ALLOWED_MIME_TYPES = {
    # Images
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    # Video
    "video/mp4", "video/webm", "video/quicktime",
    # Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
}

_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"}
_VIDEO_MIME_TYPES = {"video/mp4", "video/webm", "video/quicktime"}

_SVG_ROOT_RE = re.compile(rb"<svg[\s>]", re.IGNORECASE)
_SCRIPT_TAG_RE = re.compile(rb"<script\b.*?</script>", re.IGNORECASE | re.DOTALL)
_EVENT_HANDLER_ATTR_RE = re.compile(rb'\son[a-z]+\s*=\s*(".*?"|\'.*?\')', re.IGNORECASE)
_JAVASCRIPT_URI_RE = re.compile(rb'((?:href|xlink:href)\s*=\s*)(["\'])\s*javascript:', re.IGNORECASE)


def sniff_mime_type(content: bytes) -> str | None:
    """Inspects the file's magic bytes. Returns None for a type `filetype`
    doesn't recognize (including SVG, handled separately by `looks_like_svg`)."""
    kind = filetype.guess(content)
    return kind.mime if kind else None


def looks_like_svg(content: bytes) -> bool:
    """SVG has no magic number — it's XML text. Only trust the first few KB so a
    multi-gigabyte file can't be scanned in full just to fail this check."""
    head = content[:4096]
    return _SVG_ROOT_RE.search(head) is not None and b"<html" not in head.lower()


def sanitize_svg(content: bytes) -> bytes:
    """Strips `<script>` blocks, `on*` event-handler attributes, and
    `javascript:` URIs (SECURITY_CHECKLIST.md §6). Defense-in-depth, not a full
    XML parse — paired with serving SVGs as `Content-Disposition: attachment`
    (`api/v1/media.py`) so direct navigation downloads rather than renders them."""
    content = _SCRIPT_TAG_RE.sub(b"", content)
    content = _EVENT_HANDLER_ATTR_RE.sub(b"", content)
    content = _JAVASCRIPT_URI_RE.sub(rb"\1\2#", content)
    return content


def validate_upload(file_name: str, content: bytes) -> str:
    """Validates size + real MIME type. Returns the sniffed MIME type, or
    raises `ValidationAppError`. SVG content should be passed through
    `sanitize_svg()` before this is called for size-limit purposes, since
    sanitization only removes bytes."""
    settings = get_settings()

    mime_type = sniff_mime_type(content)
    if mime_type is None and looks_like_svg(content):
        mime_type = "image/svg+xml"

    if mime_type is None or mime_type not in _ALLOWED_MIME_TYPES:
        raise ValidationAppError(f"'{file_name}' is not an allowed file type.")

    max_mb = settings.max_video_upload_mb if mime_type in _VIDEO_MIME_TYPES else settings.max_image_upload_mb
    max_bytes = max_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise ValidationAppError(f"'{file_name}' exceeds the {max_mb}MB size limit.")

    return mime_type


def is_image(mime_type: str) -> bool:
    return mime_type in _IMAGE_MIME_TYPES
