import math
import uuid

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.auth.rbac import require_permission
from app.models.user import User
from app.schemas.crm import (
    AdminReplyCreate,
    AutoReplyConfigRead,
    AutoReplyConfigUpdate,
    ChatConversationRead,
    ChatConversationUpdate,
    ChatMessageRead,
)
from app.services.crm_service import CrmService
from app.shared.dependencies.container import get_crm_service
from app.shared.utils.common import PaginationMeta, ok

router = APIRouter(prefix="/crm", tags=["crm"])


@router.get("/conversations")
async def list_conversations(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    crm: CrmService = Depends(get_crm_service),
    _=Depends(require_permission("crm.view")),
):
    conversations, total = await crm.list_conversations(page=page, per_page=per_page)
    data = [ChatConversationRead.model_validate(c).model_dump(mode="json") for c in conversations]
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=max(1, math.ceil(total / per_page)))
    return ok(data, meta)


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_thread(
    conversation_id: uuid.UUID,
    crm: CrmService = Depends(get_crm_service),
    _=Depends(require_permission("crm.view")),
):
    conversation, messages = await crm.get_conversation_thread(conversation_id)
    return ok({
        "conversation": ChatConversationRead.model_validate(conversation).model_dump(mode="json"),
        "messages": [ChatMessageRead.model_validate(m).model_dump(mode="json") for m in messages],
    })


@router.post("/conversations/{conversation_id}/messages")
async def post_admin_reply(
    conversation_id: uuid.UUID,
    payload: AdminReplyCreate,
    crm: CrmService = Depends(get_crm_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("crm.manage")),
):
    message = await crm.post_admin_reply(conversation_id, payload.body, user.id)
    return ok(ChatMessageRead.model_validate(message).model_dump(mode="json"))


@router.patch("/conversations/{conversation_id}")
async def update_conversation(
    conversation_id: uuid.UUID,
    payload: ChatConversationUpdate,
    crm: CrmService = Depends(get_crm_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("crm.manage")),
):
    conversation = await crm.update_conversation(conversation_id, payload, user.id)
    return ok(ChatConversationRead.model_validate(conversation).model_dump(mode="json"))


@router.get("/auto-reply")
async def get_auto_reply(
    crm: CrmService = Depends(get_crm_service),
    _=Depends(require_permission("crm.view")),
):
    enabled, message = await crm.get_auto_reply_config()
    return ok(AutoReplyConfigRead(enabled=enabled, message=message).model_dump(mode="json"))


@router.put("/auto-reply")
async def update_auto_reply(
    payload: AutoReplyConfigUpdate,
    crm: CrmService = Depends(get_crm_service),
    user: User = Depends(get_current_user),
    _=Depends(require_permission("crm.manage")),
):
    enabled, message = await crm.update_auto_reply_config(payload.enabled, payload.message, user.id)
    return ok(AutoReplyConfigRead(enabled=enabled, message=message).model_dump(mode="json"))
