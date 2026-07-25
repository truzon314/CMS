from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit_log import AuditLog
from app.models.blog_post import BlogPost, BlogPostStatus
from app.models.form_submission import FormSubmission, FormSubmissionStatus
from app.models.media import Media
from app.models.page import Page, PageStatus
from app.models.user import User


class DashboardService:
    """`/dashboard/stats` — real aggregation queries (ROADMAP.md Phase 6),
    replacing the wireframe's placeholder boxes. No caching layer: these are
    cheap counts on a CMS-sized dataset, not analytics-scale aggregation."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_stats(self) -> dict:
        total_users = await self._count(select(func.count()).select_from(User).where(User.deleted_at.is_(None)))
        published_pages = await self._count(
            select(func.count()).select_from(Page).where(Page.status == PageStatus.PUBLISHED)
        )
        draft_pages = await self._count(
            select(func.count()).select_from(Page).where(Page.status != PageStatus.PUBLISHED)
        )
        total_blog_posts = await self._count(
            select(func.count()).select_from(BlogPost).where(BlogPost.deleted_at.is_(None))
        )
        published_blog_posts = await self._count(
            select(func.count())
            .select_from(BlogPost)
            .where(BlogPost.deleted_at.is_(None), BlogPost.status == BlogPostStatus.PUBLISHED)
        )
        storage_bytes = await self._count(
            select(func.coalesce(func.sum(Media.size_bytes), 0)).where(Media.deleted_at.is_(None))
        )
        pending_reviews = await self._count(
            select(func.count()).select_from(FormSubmission).where(FormSubmission.status == FormSubmissionStatus.NEW)
        )

        recent_activity_stmt = (
            select(AuditLog).options(selectinload(AuditLog.user)).order_by(AuditLog.created_at.desc()).limit(10)
        )
        recent_activity = (await self.session.execute(recent_activity_stmt)).scalars().all()

        recent_logins_stmt = (
            select(User)
            .where(User.deleted_at.is_(None), User.last_login_at.isnot(None))
            .order_by(User.last_login_at.desc())
            .limit(5)
        )
        recent_logins = (await self.session.execute(recent_logins_stmt)).scalars().all()

        latest_uploads_stmt = (
            select(Media).where(Media.deleted_at.is_(None)).order_by(Media.created_at.desc()).limit(5)
        )
        latest_uploads = (await self.session.execute(latest_uploads_stmt)).scalars().all()

        return {
            "total_users": total_users,
            "published_pages": published_pages,
            "draft_pages": draft_pages,
            "total_blog_posts": total_blog_posts,
            "published_blog_posts": published_blog_posts,
            "storage_bytes": storage_bytes,
            "pending_reviews": pending_reviews,
            "recent_activity": [
                {
                    "id": str(a.id),
                    "user_name": a.user.full_name if a.user else "System",
                    "action": a.action,
                    "entity_type": a.entity_type,
                    "created_at": a.created_at.isoformat(),
                }
                for a in recent_activity
            ],
            "recent_logins": [
                {"id": str(u.id), "full_name": u.full_name, "last_login_at": u.last_login_at.isoformat()}
                for u in recent_logins
            ],
            "latest_uploads": [
                {"id": str(m.id), "file_name": m.file_name, "url": m.url, "created_at": m.created_at.isoformat()}
                for m in latest_uploads
            ],
        }

    async def _count(self, stmt) -> int:
        return (await self.session.execute(stmt)).scalar_one()
