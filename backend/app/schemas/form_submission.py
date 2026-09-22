from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.form_submission import FormSubmissionStatus


class FormSubmissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    form_key: str
    name: str
    phone: str | None
    email: str | None
    property_type_interest: str | None
    message: str | None
    status: FormSubmissionStatus
    assigned_to: str | None
    ip_address: str | None
    submitted_at: datetime


class FormSubmissionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: FormSubmissionStatus | None = None
    assigned_to: str | None = None
