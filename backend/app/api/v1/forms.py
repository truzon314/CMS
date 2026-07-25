import math
import uuid

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.core.container import get_form_submission_service
from app.models.user import User
from app.schemas.common import PaginationMeta, ok
from app.schemas.form_submission import FormSubmissionRead, FormSubmissionUpdate
from app.services.form_submission_service import FormSubmissionService

router = APIRouter(prefix="/forms", tags=["forms"])


@router.get("/submissions")
async def list_submissions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    form_key: str | None = None,
    status: str | None = None,
    submission_service: FormSubmissionService = Depends(get_form_submission_service),
    _=Depends(require_permission("forms.view")),
):
    submissions, total = await submission_service.list_submissions(
        page=page, per_page=per_page, form_key=form_key, status=status
    )
    data = [FormSubmissionRead.model_validate(s).model_dump(mode="json") for s in submissions]
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=max(1, math.ceil(total / per_page)))
    return ok(data, meta)


@router.get("/submissions/export")
async def export_submissions(
    form_key: str | None = None,
    status: str | None = None,
    submission_service: FormSubmissionService = Depends(get_form_submission_service),
    _=Depends(require_permission("forms.view")),
):
    csv_text = await submission_service.export_csv(form_key=form_key, status=status)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=form-submissions.csv"},
    )


@router.get("/submissions/{submission_id}")
async def get_submission(
    submission_id: uuid.UUID,
    submission_service: FormSubmissionService = Depends(get_form_submission_service),
    _=Depends(require_permission("forms.view")),
):
    submission = await submission_service.get(submission_id)
    return ok(FormSubmissionRead.model_validate(submission).model_dump(mode="json"))


@router.put("/submissions/{submission_id}")
async def update_submission(
    submission_id: uuid.UUID,
    payload: FormSubmissionUpdate,
    submission_service: FormSubmissionService = Depends(get_form_submission_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("forms.manage")),
):
    submission = await submission_service.update(submission_id, payload, user.id)
    return ok(FormSubmissionRead.model_validate(submission).model_dump(mode="json"))


@router.delete("/submissions/{submission_id}")
async def delete_submission(
    submission_id: uuid.UUID,
    submission_service: FormSubmissionService = Depends(get_form_submission_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("forms.manage")),
):
    await submission_service.delete(submission_id, user.id)
    return ok({"deleted": True})
