"""Shared field types (SECURITY_CHECKLIST.md §3 — slugs validated against a
strict pattern before use in any URL, so no path-traversal-ish characters
are ever accepted into a `slug` column)."""

from typing import Annotated

from pydantic import StringConstraints

Slug = Annotated[str, StringConstraints(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", min_length=1, max_length=255)]
