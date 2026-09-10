import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin, utcnow
from app.models.role import role_permission


class PermissionScope(str, enum.Enum):
    GLOBAL = "GLOBAL"
    PROJECT = "PROJECT"
    OWNED = "OWNED"


class Permission(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "permissions"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    module: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    scope: Mapped[PermissionScope] = mapped_column(
        Enum(PermissionScope, name="PermissionScope", create_type=False),
        default=PermissionScope.GLOBAL,
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(String(255), default=None)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False), default=utcnow)

    roles: Mapped[list["Role"]] = relationship(secondary=role_permission, back_populates="permissions")  # noqa: F821

