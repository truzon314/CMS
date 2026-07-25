from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.types import ASGIApp

_current_ip: ContextVar[str | None] = ContextVar("audit_ip", default=None)
_current_user_agent: ContextVar[str | None] = ContextVar("audit_user_agent", default=None)


def current_ip() -> str | None:
    return _current_ip.get()


def current_user_agent() -> str | None:
    return _current_user_agent.get()


class AuditContextMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        ip_token = _current_ip.set(request.client.host if request.client else None)
        ua_token = _current_user_agent.set(request.headers.get("user-agent"))
        try:
            return await call_next(request)
        finally:
            _current_ip.reset(ip_token)
            _current_user_agent.reset(ua_token)
