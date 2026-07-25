from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, UUIDPrimaryKeyMixin
from app.models.role import role_permission


class Permission(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "permission"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    module: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), default=None)

    roles: Mapped[list["Role"]] = relationship(secondary=role_permission, back_populates="permissions")  # noqa: F821
