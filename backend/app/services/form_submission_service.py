import csv
import io
import uuid

from app.shared.exceptions.exceptions import NotFoundError
from app.domain.repositories.form_submission_repository import FormSubmissionRepository
from app.models.form_submission import FormSubmission
from app.schemas.form_submission import FormSubmissionUpdate
from app.services.audit_service import AuditService

_CSV_COLUMNS = [
    "form_key", "name", "phone", "email", "property_type_interest",
    "message", "status", "submitted_at",
]


class FormSubmissionService:
    def __init__(self, submissions: FormSubmissionRepository, audit: AuditService):
        self.submissions = submissions
        self.audit = audit

    async def list_submissions(
        self, *, page: int, per_page: int, form_key: str | None, status: str | None
    ) -> tuple[list[FormSubmission], int]:
        return await self.submissions.list(page=page, per_page=per_page, form_key=form_key, status=status)

    async def get(self, submission_id: uuid.UUID) -> FormSubmission:
        submission = await self.submissions.get_by_id(submission_id)
        if not submission:
            raise NotFoundError("Submission not found.")
        return submission

    async def update(
        self, submission_id: uuid.UUID, payload: FormSubmissionUpdate, actor_id: uuid.UUID | None = None
    ) -> FormSubmission:
        submission = await self.get(submission_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(submission, field, value)
        submission = await self.submissions.update(submission)
        await self.audit.log(actor_id, "form_submission.update", "form_submission", submission.id)
        return submission

    async def delete(self, submission_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> None:
        submission = await self.get(submission_id)
        await self.submissions.delete(submission)
        await self.audit.log(actor_id, "form_submission.delete", "form_submission", submission.id)

    async def export_csv(self, *, form_key: str | None, status: str | None) -> str:
        rows = await self.submissions.list_all_matching(form_key=form_key, status=status)
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(_CSV_COLUMNS)
        for row in rows:
            writer.writerow(
                [
                    row.form_key, row.name, row.phone or "", row.email or "",
                    row.property_type_interest or "", row.message or "",
                    row.status.value, row.submitted_at.isoformat(),
                ]
            )
        return buffer.getvalue()
