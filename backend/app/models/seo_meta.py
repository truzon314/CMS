from typing import Any

from sqlalchemy import ARRAY, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class SeoMeta(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "seo_meta"

    seo_title: Mapped[str | None] = mapped_column("seoTitle", String(255), default=None)
    meta_description: Mapped[str | None] = mapped_column("metaDescription", String(500), default=None)
    keywords: Mapped[list[str] | None] = mapped_column("keywords", ARRAY(String), default=list)
    canonical_url: Mapped[str | None] = mapped_column("canonicalUrl", String(500), default=None)
    og_title: Mapped[str | None] = mapped_column("ogTitle", String(255), default=None)
    og_description: Mapped[str | None] = mapped_column("ogDescription", String(500), default=None)
    og_image_id: Mapped[str | None] = mapped_column("ogImageId", String, ForeignKey("media.id"), default=None)
    og_type: Mapped[str | None] = mapped_column("ogType", String(50), default="website")
    twitter_card: Mapped[str | None] = mapped_column("twitterCard", String(50), default="summary_large_image")
    twitter_title: Mapped[str | None] = mapped_column("twitterTitle", String(255), default=None)
    twitter_description: Mapped[str | None] = mapped_column("twitterDescription", String(500), default=None)
    twitter_image_id: Mapped[str | None] = mapped_column("twitterImageId", String, ForeignKey("media.id"), default=None)
    robots: Mapped[str | None] = mapped_column(String(100), default="index, follow")
    schema_jsonld: Mapped[dict | None] = mapped_column("schemaJsonLd", JSONB, default=None)
    structured_data: Mapped[dict | None] = mapped_column("structuredData", JSONB, default=None)

    @property
    def og_image_media_id(self) -> str | None:
        return self.og_image_id

    @og_image_media_id.setter
    def og_image_media_id(self, value: str | None) -> None:
        self.og_image_id = value

    @property
    def twitter_image_media_id(self) -> str | None:
        return self.twitter_image_id

    @twitter_image_media_id.setter
    def twitter_image_media_id(self, value: str | None) -> None:
        self.twitter_image_id = value

    @property
    def twitter_card_type(self) -> str | None:
        return self.twitter_card

    @twitter_card_type.setter
    def twitter_card_type(self, value: str | None) -> None:
        self.twitter_card = value

    @property
    def focus_keyword(self) -> str | None:
        if self.keywords and len(self.keywords) > 0:
            return self.keywords[0]
        return None

    @focus_keyword.setter
    def focus_keyword(self, value: str | None) -> None:
        if value:
            if not self.keywords:
                self.keywords = [value]
            elif value not in self.keywords:
                self.keywords.insert(0, value)


