import uuid

from sqlalchemy import JSON, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PageBlock(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "page_block"

    page_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("page.id", ondelete="CASCADE"), nullable=False
    )
    block_definition_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("block_definition.id"), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    page: Mapped["Page"] = relationship(back_populates="blocks")  # noqa: F821
    block_definition: Mapped["BlockDefinition"] = relationship()  # noqa: F821
