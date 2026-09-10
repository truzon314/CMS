from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class RedirectRule(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "redirect_rules"

    from_path: Mapped[str] = mapped_column("fromPath", String(500), unique=True, index=True, nullable=False)
    to_path: Mapped[str] = mapped_column("toPath", String(500), nullable=False)
    status_code: Mapped[int] = mapped_column("statusCode", Integer, default=301, nullable=False)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True, nullable=False)
    hits: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    @property
    def hit_count(self) -> int:
        return self.hits

    @hit_count.setter
    def hit_count(self, value: int) -> None:
        self.hits = value


