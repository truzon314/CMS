from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPrimaryKeyMixin


class BlockDefinition(UUIDPrimaryKeyMixin, Base):
    """Catalog of available block types — a lookup table, not a hardcoded enum
    (ERD.md), so a new block type is an INSERT + a new editor component, not a
    migration touching every existing page.
    """

    __tablename__ = "block_definition"

    key: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
