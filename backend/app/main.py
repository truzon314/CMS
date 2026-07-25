from fastapi import Depends, FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.media_files import router as media_files_router
from app.api.public import router as public_router
from app.api.v1.audit_logs import router as audit_logs_router
from app.api.v1.auth import router as auth_router
from app.api.v1.blog import router as blog_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.forms import router as forms_router
from app.api.v1.media import router as media_router
from app.api.v1.menus import router as menus_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.pages import router as pages_router
from app.api.v1.properties import router as properties_router
from app.api.v1.roles import router as roles_router
from app.api.v1.search import router as search_router
from app.api.v1.settings import router as settings_router
from app.api.v1.taxonomy import router as taxonomy_router
from app.api.v1.trash import router as trash_router
from app.api.v1.users import router as users_router
from app.core.audit_context import AuditContextMiddleware
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging
from app.core.rate_limit import global_backstop
from app.core.security_headers import SecurityHeadersMiddleware
from app.database.session import engine

configure_logging()
settings = get_settings()

app = FastAPI(title="Truzon CMS API", version="0.1.0", dependencies=[Depends(global_backstop)])

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuditContextMiddleware)
app.add_middleware(SecurityHeadersMiddleware)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "meta": None,
            "error": {"code": exc.code, "message": exc.message, "details": exc.details},
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "data": None,
            "meta": None,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request.",
                "details": {"errors": jsonable_encoder(exc.errors())},
            },
        },
    )


app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(roles_router, prefix="/api/v1")
app.include_router(pages_router, prefix="/api/v1")
app.include_router(media_router, prefix="/api/v1")
app.include_router(media_files_router)
app.include_router(blog_router, prefix="/api/v1")
app.include_router(properties_router, prefix="/api/v1")
app.include_router(taxonomy_router, prefix="/api/v1")
app.include_router(menus_router, prefix="/api/v1")
app.include_router(forms_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")
app.include_router(audit_logs_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(trash_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(public_router)


@app.get("/health")
async def health() -> dict:
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    return {"success": True, "data": {"status": "ok", "environment": settings.environment}}
