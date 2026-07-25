"""Dependency-free rate limiting (SECURITY_CHECKLIST.md §7) — in-memory
sliding-window counters, no Redis/slowapi. Correct for this project's single-
process deployment; would need a shared store (Redis) behind a load balancer
with multiple backend instances — documented here, not silently assumed away.
"""

import time
from collections import defaultdict, deque

from fastapi import Request

from app.core.exceptions import AppError


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
    """Call from inside a route body (needs the parsed body for per-account/
    per-email keys, which isn't available in a plain dependency before
    validation runs). Raises 429 via the same `AppError` envelope as
    everything else."""
    key = f"{scope}:{_client_ip(request)}:{extra_key}"
    _limiter.check(key, limit=limit, window_seconds=window_seconds)


def global_backstop(request: Request) -> None:
    """Generous per-IP backstop across all of `/api/v1/*` and `/public/*`
    (SECURITY_CHECKLIST.md §7's 4th bullet) — wired as global middleware,
    not a per-route dependency."""
    rate_limit(request, scope="global", limit=300, window_seconds=60)
