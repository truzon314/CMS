from fastapi import Depends, FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.modules.audit_logs.presentation.router import router as audit_logs_router
from app.modules.auth.presentation.router import router as auth_router
from app.modules.blog.presentation.router import router as blog_router
from app.modules.careers.presentation.router import router as careers_router
from app.modules.crm.presentation.router import router as crm_router
from app.modules.dashboard.presentation.router import router as dashboard_router
from app.modules.gallery.presentation.router import router as gallery_router
from app.modules.leads.presentation.router import router as forms_router
from app.modules.mapping.presentation.router import router as mapping_router
from app.modules.media.presentation.media_files_router import router as media_files_router
from app.modules.media.presentation.router import router as media_router
from app.modules.menus.presentation.router import router as menus_router
from app.modules.notifications.presentation.router import router as notifications_router
from app.modules.pages.presentation.router import router as pages_router
from app.modules.properties.presentation.router import router as properties_router
from app.modules.public.presentation.router import router as public_router
from app.modules.roles.presentation.router import router as roles_router
from app.modules.search.presentation.router import router as search_router
from app.modules.seo.presentation.redirects_router import router as redirects_router
from app.modules.seo.presentation.router import router as seo_router
from app.modules.settings.presentation.router import router as settings_router
from app.modules.taxonomy.presentation.router import router as taxonomy_router
from app.modules.testimonials.presentation.router import router as testimonials_router
from app.modules.trash.presentation.router import router as trash_router
from app.modules.users.presentation.router import router as users_router
from app.shared.config.config import get_settings
from app.shared.database.session import engine
from app.shared.exceptions.exceptions import AppError
from app.shared.logging.logging import configure_logging
from app.shared.middleware.audit_context import AuditContextMiddleware
from app.shared.security.rate_limit import global_backstop
from app.shared.security.security_headers import SecurityHeadersMiddleware

configure_logging()
settings = get_settings()

# Interactive API docs (Swagger UI, ReDoc, and the raw OpenAPI schema they're
# built from) are a reconnaissance gift to anyone probing the public
# internet — no legitimate client needs to browse the schema in production;
# admin frontend devs use it against a local/staging backend instead.
_docs_enabled = settings.environment != "production"
app = FastAPI(
    title="Truzon CMS API",
    version="0.1.0",
    dependencies=[Depends(global_backstop)],
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
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
app.include_router(careers_router, prefix="/api/v1")
app.include_router(gallery_router, prefix="/api/v1")
app.include_router(testimonials_router, prefix="/api/v1")
app.include_router(mapping_router, prefix="/api/v1")
app.include_router(crm_router, prefix="/api/v1")
app.include_router(taxonomy_router, prefix="/api/v1")
app.include_router(menus_router, prefix="/api/v1")
app.include_router(forms_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")
app.include_router(seo_router, prefix="/api/v1")
app.include_router(redirects_router, prefix="/api/v1")
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
