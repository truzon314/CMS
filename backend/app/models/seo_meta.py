from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, UUIDPrimaryKeyMixin


class SeoMeta(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "seo_metas"

    seo_title: Mapped[str | None] = mapped_column("seoTitle", String(255), default=None)
    meta_description: Mapped[str | None] = mapped_column("metaDescription", String(500), default=None)
    focus_keyword: Mapped[str | None] = mapped_column("focusKeyword", String(255), default=None)
    keywords: Mapped[list | None] = mapped_column(JSON, default=None)
    canonical_url: Mapped[str | None] = mapped_column("canonicalUrl", String(500), default=None)
    og_title: Mapped[str | None] = mapped_column("ogTitle", String(255), default=None)
    og_description: Mapped[str | None] = mapped_column("ogDescription", String(500), default=None)
    og_image_media_id: Mapped[str | None] = mapped_column("ogImageMediaId", String, default=None)
    twitter_card_type: Mapped[str | None] = mapped_column("twitterCardType", String(50), default=None)
    twitter_title: Mapped[str | None] = mapped_column("twitterTitle", String(255), default=None)
    twitter_description: Mapped[str | None] = mapped_column("twitterDescription", String(500), default=None)
    twitter_image_media_id: Mapped[str | None] = mapped_column("twitterImageMediaId", String, default=None)
    robots: Mapped[str | None] = mapped_column(String(100), default="index,follow")
    schema_jsonld: Mapped[dict | None] = mapped_column("schemaJsonLd", JSON, default=None)

