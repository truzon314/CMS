from sqlalchemy import Boolean, Column, ForeignKey, String, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

role_permission = Table(
    "role_permission",
    Base.metadata,
    Column("role_id", UUID(as_uuid=True), ForeignKey("role.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "permission_id",
        UUID(as_uuid=True),
        ForeignKey("permission.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Role(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "role"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), default=None)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)

    permissions: Mapped[list["Permission"]] = relationship(  # noqa: F821
        secondary=role_permission, back_populates="roles"
    )
    users: Mapped[list["User"]] = relationship(back_populates="role")  # noqa: F821
