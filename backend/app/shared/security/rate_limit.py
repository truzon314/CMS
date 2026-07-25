import time
from collections import defaultdict, deque

from fastapi import Request

from app.shared.exceptions.exceptions import AppError


class RateLimitExceededError(AppError):
    status_code = 429
    code = "RATE_LIMITED"

    def __init__(self, message: str = "Too many requests — please try again shortly.") -> None:
        super().__init__(message)


class _SlidingWindowLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, *, limit: int, window_seconds: float) -> None:
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > window_seconds:
            hits.popleft()
        if len(hits) >= limit:
            raise RateLimitExceededError()
        hits.append(now)


_limiter = _SlidingWindowLimiter()


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def rate_limit(request: Request, *, scope: str, limit: int, window_seconds: float, extra_key: str = "") -> None:
    key = f"{scope}:{_client_ip(request)}:{extra_key}"
    _limiter.check(key, limit=limit, window_seconds=window_seconds)


def global_backstop(request: Request) -> None:
    rate_limit(request, scope="global", limit=300, window_seconds=60)
