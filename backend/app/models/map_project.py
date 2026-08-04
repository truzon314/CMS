from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class MapProject(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "map_project"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    map_provider_type: Mapped[str] = mapped_column(String(20), default="google", nullable=False)

    layers: Mapped[list["MapLayer"]] = relationship(  # noqa: F821
        back_populates="project", cascade="all, delete-orphan"
    )
    share_link: Mapped["MapShareLink | None"] = relationship(  # noqa: F821
        back_populates="project", cascade="all, delete-orphan", uselist=False
    )
