from fastapi import APIRouter, Depends

from app.auth.rbac import require_permission
from app.core.container import get_dashboard_service
from app.schemas.common import ok
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats(
    dashboard_service: DashboardService = Depends(get_dashboard_service),
    _=Depends(require_permission("analytics.view")),
):
    stats = await dashboard_service.get_stats()
    return ok(stats)
