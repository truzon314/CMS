from sqlalchemy import BigInteger, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class Media(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "media"

    file_name: Mapped[str] = mapped_column("fileName", String(255), nullable=False)
    file_key: Mapped[str] = mapped_column("fileKey", String(500), unique=True, nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    mime_type: Mapped[str] = mapped_column("mimeType", String(255), nullable=False)
    size_bytes: Mapped[int] = mapped_column("sizeBytes", BigInteger, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer, default=None)
    height: Mapped[int | None] = mapped_column(Integer, default=None)
    alt_text: Mapped[str | None] = mapped_column("altText", String(500), default=None)
    folder_id: Mapped[str | None] = mapped_column(
        "folderId", String, ForeignKey("media_folders.id"), default=None
    )
    uploaded_by: Mapped[str] = mapped_column("uploadedById", String, ForeignKey("users.id"), nullable=False)

