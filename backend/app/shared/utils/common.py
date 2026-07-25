from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int
    per_page: int
    total: int
    total_pages: int


class ApiErrorDetail(BaseModel):
    code: str
    message: str
    details: dict | None = None


class ApiEnvelope(BaseModel, Generic[T]):
    """Matches the response envelope defined in API.md — every endpoint returns this shape."""

    success: bool
    data: T | None = None
    meta: PaginationMeta | None = None
    error: ApiErrorDetail | None = None


def ok(data: object = None, meta: PaginationMeta | None = None) -> dict:
    return {"success": True, "data": data, "meta": meta, "error": None}
