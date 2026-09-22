from sqlalchemy import Boolean, Column, ForeignKey, String, Table

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

role_permission = Table(
    "_PermissionToRole",
    Base.metadata,
    Column("A", String(255), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    Column("B", String(255), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


class Role(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "roles"


class Role(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "roles"

    name: Mapped[RoleType] = mapped_column(
        Enum(RoleType, name="RoleType", create_type=False), unique=True, nullable=False
    )
    display_name: Mapped[str] = mapped_column("displayName", String(255), nullable=False, default="")
    description: Mapped[str | None] = mapped_column(String(255), default=None)
    is_system: Mapped[bool] = mapped_column("isSystem", Boolean, default=False)

    permissions: Mapped[list["Permission"]] = relationship(  # noqa: F821
        secondary=role_permission, back_populates="roles"
    )
    users: Mapped[list["User"]] = relationship(back_populates="role")  # noqa: F821


