import enum
import uuid

from sqlalchemy import BigInteger, Enum as SQLEnum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class MediaTypeEnum(str, enum.Enum):
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    DOCUMENT = "DOCUMENT"
    OTHER = "OTHER"


class Media(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Soft-deletable (ERD.md) — the Trash module queries `deleted_at IS NOT NULL`
    rather than a separate table; the underlying storage object is only removed
    on a future permanent-delete action, not here."""

    __tablename__ = "media"

    file_name: Mapped[str] = mapped_column("fileName", String(255), nullable=False)
    file_key: Mapped[str] = mapped_column("fileKey", String(500), unique=True, nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    mime_type: Mapped[str] = mapped_column("mimeType", String(255), nullable=False)
    type: Mapped[str] = mapped_column(
        "type",
        SQLEnum("IMAGE", "VIDEO", "DOCUMENT", "OTHER", name="MediaType", native_enum=True, create_type=False),
        nullable=False,
        default="IMAGE",
    )
    size_bytes: Mapped[int] = mapped_column("sizeBytes", BigInteger, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer, default=None)
    height: Mapped[int | None] = mapped_column(Integer, default=None)
    alt_text: Mapped[str | None] = mapped_column("altText", String(500), default=None)
    folder_id: Mapped[str | None] = mapped_column(
        "folderId", String(255), ForeignKey("media_folders.id"), default=None
    )
    uploaded_by: Mapped[str] = mapped_column("uploadedById", String(255), ForeignKey("users.id"), nullable=False)
    storage_provider: Mapped[str] = mapped_column("storageProvider", String(50), nullable=False, default="local")

