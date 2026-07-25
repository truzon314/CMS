import uuid

from sqlalchemy import JSON, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPrimaryKeyMixin


class SeoMeta(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "seo_meta"

    seo_title: Mapped[str | None] = mapped_column(String(255), default=None)
    meta_description: Mapped[str | None] = mapped_column(String(500), default=None)
    keywords: Mapped[list | None] = mapped_column(JSON, default=None)
    canonical_url: Mapped[str | None] = mapped_column(String(500), default=None)
    og_title: Mapped[str | None] = mapped_column(String(255), default=None)
    og_description: Mapped[str | None] = mapped_column(String(500), default=None)
    og_image_media_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), default=None)
    twitter_card_type: Mapped[str | None] = mapped_column(String(50), default=None)
    robots: Mapped[str | None] = mapped_column(String(100), default="index,follow")
    schema_jsonld: Mapped[dict | None] = mapped_column(JSON, default=None)
