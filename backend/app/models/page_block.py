from sqlalchemy import JSON, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PageBlock(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "page_blocks"

    page_id: Mapped[str] = mapped_column(
        "pageId", String, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False
    )
    block_definition_id: Mapped[str] = mapped_column(
        "blockDefinitionId", String, ForeignKey("block_definitions.id"), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    page: Mapped["Page"] = relationship(back_populates="blocks")  # noqa: F821
    block_definition: Mapped["BlockDefinition"] = relationship()  # noqa: F821

