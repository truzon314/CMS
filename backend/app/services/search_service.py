
from pydantic import BaseModel

from app.domain.repositories.blog_post_repository import BlogPostRepository
from app.domain.repositories.media_repository import MediaRepository
from app.domain.repositories.page_repository import PageRepository
from app.domain.repositories.property_repository import PropertyRepository
from app.domain.repositories.user_repository import UserRepository

_LIMIT_PER_TYPE = 5


class SearchResult(BaseModel):
    type: str
    id: str
    title: str
    subtitle: str | None = None
    link: str


class SearchService:
    """Global ⌘K search — `ILIKE` across Pages/Blog/Properties/Media/Users
    (ROADMAP.md Phase 6: "start with ILIKE queries... a real full-text/
    vector search engine is a later optimization, not this phase")."""

    def __init__(
        self,
        pages: PageRepository,
        posts: BlogPostRepository,
        properties: PropertyRepository,
        media: MediaRepository,
        users: UserRepository,
    ):
        self.pages = pages
        self.posts = posts
        self.properties = properties
        self.media = media
        self.users = users

    async def search(self, query: str) -> list[SearchResult]:
        if not query or len(query.strip()) < 2:
            return []

        results: list[SearchResult] = []

        pages = await self.pages.list_all()
        for p in pages:
            if query.lower() in p.title.lower():
                results.append(
                    SearchResult(
                        type="page", id=str(p.id), title=p.title, subtitle="Page", link=f"/pages/{p.page_type.value}"
                    )
                )

        posts, _ = await self.posts.list(page=1, per_page=_LIMIT_PER_TYPE, search=query)
        for post in posts:
            results.append(
                SearchResult(
                    type="blog_post", id=str(post.id), title=post.title, subtitle="Blog post",
                    link=f"/blog/posts/{post.id}",
                )
            )

        properties, _ = await self.properties.list(page=1, per_page=_LIMIT_PER_TYPE, search=query)
        for prop in properties:
            results.append(
                SearchResult(
                    type="property", id=str(prop.id), title=prop.name, subtitle="Property",
                    link=f"/properties/{prop.id}",
                )
            )

        media_items, _ = await self.media.list(page=1, per_page=_LIMIT_PER_TYPE, search=query)
        for m in media_items:
            results.append(
                SearchResult(type="media", id=str(m.id), title=m.file_name, subtitle="Media", link="/media")
            )

        users, _ = await self.users.list(page=1, per_page=_LIMIT_PER_TYPE, search=query)
        for u in users:
            results.append(
                SearchResult(type="user", id=str(u.id), title=u.full_name, subtitle=u.email, link=f"/users/{u.id}")
            )

        return results
