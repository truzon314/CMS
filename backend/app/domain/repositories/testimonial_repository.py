import uuid
from typing import Protocol

from app.models.testimonial import Testimonial


class TestimonialRepository(Protocol):
    async def list(
        self, *, page: int, per_page: int, is_published: bool | None = None, featured_only: bool = False
    ) -> tuple[list[Testimonial], int]: ...

    async def get_by_id(self, testimonial_id: uuid.UUID) -> Testimonial | None: ...

    async def create(self, testimonial: Testimonial) -> Testimonial: ...

    async def update(self, testimonial: Testimonial) -> Testimonial: ...

    async def delete(self, testimonial: Testimonial) -> None: ...
