"""Unit tests for the shared Slug field type (SECURITY_CHECKLIST.md §3)."""

import pytest
from pydantic import ValidationError

from app.schemas.blog import BlogPostCreate
from app.schemas.property import PropertyCreate


@pytest.mark.parametrize("slug", ["valid-slug", "abc123", "a", "one-two-three"])
def test_valid_slugs_are_accepted(slug):
    BlogPostCreate(title="T", slug=slug)
    PropertyCreate(name="N", slug=slug)


@pytest.mark.parametrize(
    "slug",
    [
        "Has-Uppercase",
        "has spaces",
        "trailing-",
        "-leading",
        "double--hyphen",
        "../../etc/passwd",
        "slug/with/slashes",
        "",
    ],
)
def test_invalid_slugs_are_rejected(slug):
    with pytest.raises(ValidationError):
        BlogPostCreate(title="T", slug=slug)
