import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy import select

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.database.session import AsyncSessionLocal
from app.models.redirect import RedirectRule
from app.models.user import User
from app.shared.utils.common import ok

router = APIRouter(prefix="/redirects", tags=["redirects"])


class RedirectCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    from_path: str
    to_path: str
    status_code: int = 301
    is_active: bool = True

    @field_validator("from_path", "to_path")
    @classmethod
    def validate_path(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith("/"):
            v = "/" + v
        return v


class RedirectUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    from_path: str | None = None
    to_path: str | None = None
    status_code: int | None = None
    is_active: bool | None = None


@router.get("")
async def list_redirects(_=Depends(require_permission("settings.manage"))):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(RedirectRule).order_by(RedirectRule.created_at.desc()))
        rules = result.scalars().all()
        return ok([
            {
                "id": str(r.id),
                "from_path": r.from_path,
                "to_path": r.to_path,
                "status_code": r.status_code,
                "hit_count": r.hit_count,
                "is_active": r.is_active,
                "created_at": r.created_at.isoformat(),
            }
            for r in rules
        ])


@router.post("")
async def create_redirect(
    payload: RedirectCreate,
    user: User = Depends(get_current_user),
    _=Depends(require_permission("settings.manage")),
):
    async with AsyncSessionLocal() as session:
        existing = await session.execute(select(RedirectRule).where(RedirectRule.from_path == payload.from_path))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Redirect rule for this source path already exists.")

        rule = RedirectRule(
            from_path=payload.from_path,
            to_path=payload.to_path,
            status_code=payload.status_code,
            is_active=payload.is_active,
        )
        session.add(rule)
        await session.commit()
        await session.refresh(rule)
        return ok({
            "id": str(rule.id),
            "from_path": rule.from_path,
            "to_path": rule.to_path,
            "status_code": rule.status_code,
            "hit_count": rule.hit_count,
            "is_active": rule.is_active,
            "created_at": rule.created_at.isoformat(),
        })


@router.put("/{redirect_id}")
async def update_redirect(
    redirect_id: uuid.UUID,
    payload: RedirectUpdate,
    user: User = Depends(get_current_user),
    _=Depends(require_permission("settings.manage")),
):
    async with AsyncSessionLocal() as session:
        rule = await session.get(RedirectRule, redirect_id)
        if not rule:
            raise HTTPException(status_code=404, detail="Redirect rule not found.")

        if payload.from_path is not None:
            rule.from_path = payload.from_path
        if payload.to_path is not None:
            rule.to_path = payload.to_path
        if payload.status_code is not None:
            rule.status_code = payload.status_code
        if payload.is_active is not None:
            rule.is_active = payload.is_active

        await session.commit()
        await session.refresh(rule)
        return ok({
            "id": str(rule.id),
            "from_path": rule.from_path,
            "to_path": rule.to_path,
            "status_code": rule.status_code,
            "hit_count": rule.hit_count,
            "is_active": rule.is_active,
            "created_at": rule.created_at.isoformat(),
        })


@router.delete("/{redirect_id}")
async def delete_redirect(
    redirect_id: uuid.UUID,
    user: User = Depends(get_current_user),
    _=Depends(require_permission("settings.manage")),
):
    async with AsyncSessionLocal() as session:
        rule = await session.get(RedirectRule, redirect_id)
        if not rule:
            raise HTTPException(status_code=404, detail="Redirect rule not found.")

        await session.delete(rule)
        await session.commit()
        return ok({"success": True})
