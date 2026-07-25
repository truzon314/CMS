import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.form_submission import FormSubmission

_WITH_ASSIGNEE = selectinload(FormSubmission.assignee)


class SqlAlchemyFormSubmissionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, submission_id: uuid.UUID) -> FormSubmission | None:
        stmt = select(FormSubmission).where(FormSubmission.id == submission_id).options(_WITH_ASSIGNEE)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    def _filtered(self, stmt, form_key: str | None, status: str | None):
        if form_key:
            stmt = stmt.where(FormSubmission.form_key == form_key)
        if status:
            stmt = stmt.where(FormSubmission.status == status)
        return stmt

    async def list(
        self, *, page: int, per_page: int, form_key: str | None = None, status: str | None = None
    ) -> tuple[list[FormSubmission], int]:
        stmt = self._filtered(select(FormSubmission).options(_WITH_ASSIGNEE), form_key, status)
        count_stmt = self._filtered(select(func.count()).select_from(FormSubmission), form_key, status)

        total = (await self.session.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(FormSubmission.submitted_at.desc()).offset((page - 1) * per_page).limit(per_page)
        rows = (await self.session.execute(stmt)).scalars().all()
        return list(rows), total

    async def list_all_matching(self, *, form_key: str | None, status: str | None) -> list[FormSubmission]:
        stmt = self._filtered(select(FormSubmission), form_key, status).order_by(FormSubmission.submitted_at.desc())
        return list((await self.session.execute(stmt)).scalars().all())

    async def create(self, submission: FormSubmission) -> FormSubmission:
        self.session.add(submission)
        await self.session.commit()
        await self.session.refresh(submission)
        return submission

    async def update(self, submission: FormSubmission) -> FormSubmission:
        await self.session.commit()
        await self.session.refresh(submission, attribute_names=["assignee"])
        return submission

    async def delete(self, submission: FormSubmission) -> None:
        await self.session.delete(submission)
        await self.session.commit()
