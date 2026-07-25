from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.services.search_service import SearchService
from app.shared.dependencies.container import get_search_service
from app.shared.utils.common import ok

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def search(
    q: str = "",
    search_service: SearchService = Depends(get_search_service),
    _user: User = Depends(get_current_user),
):
    results = await search_service.search(q)
    return ok([r.model_dump(mode="json") for r in results])
