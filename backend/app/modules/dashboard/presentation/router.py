from fastapi import APIRouter, Depends

from app.auth.rbac import require_permission
from app.services.dashboard_service import DashboardService
from app.shared.dependencies.container import get_dashboard_service
from app.shared.utils.common import ok

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats(
    dashboard_service: DashboardService = Depends(get_dashboard_service),
    _=Depends(require_permission("analytics.view")),
):
    stats = await dashboard_service.get_stats()
    return ok(stats)
