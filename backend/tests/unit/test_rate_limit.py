"""Unit tests for the sliding-window rate limiter (app/core/rate_limit.py) —
pure logic, no DB, no HTTP."""

import pytest

from app.core.rate_limit import RateLimitExceededError, _SlidingWindowLimiter


def test_allows_up_to_the_limit():
    limiter = _SlidingWindowLimiter()
    for _ in range(5):
        limiter.check("key", limit=5, window_seconds=60)


def test_rejects_beyond_the_limit():
    limiter = _SlidingWindowLimiter()
    for _ in range(5):
        limiter.check("key", limit=5, window_seconds=60)

    with pytest.raises(RateLimitExceededError):
        limiter.check("key", limit=5, window_seconds=60)


def test_keys_are_independent():
    limiter = _SlidingWindowLimiter()
    for _ in range(5):
        limiter.check("key-a", limit=5, window_seconds=60)

    # A different key has its own budget, unaffected by key-a's usage.
    limiter.check("key-b", limit=5, window_seconds=60)


def test_window_expiry_frees_up_budget():
    limiter = _SlidingWindowLimiter()
    limiter.check("key", limit=1, window_seconds=0.05)
    with pytest.raises(RateLimitExceededError):
        limiter.check("key", limit=1, window_seconds=0.05)

    import time

    time.sleep(0.1)
    limiter.check("key", limit=1, window_seconds=0.05)
