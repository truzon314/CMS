import uuid

from app.shared.exceptions.exceptions import NotFoundError, ValidationAppError
from app.domain.repositories.blog_post_repository import BlogPostRepository
from app.domain.repositories.category_repository import CategoryRepository
from app.domain.repositories.form_submission_repository import FormSubmissionRepository
from app.domain.repositories.media_repository import MediaRepository
from app.domain.repositories.menu_repository import MenuRepository
from app.domain.repositories.page_repository import PageRepository
from app.domain.repositories.property_repository import PropertyRepository
from app.domain.repositories.settings_repository import SettingsRepository
from app.domain.repositories.user_repository import UserRepository
from app.models.blog_post import BlogPost, BlogPostStatus
from app.models.form_submission import FormSubmission
from app.models.page import Page, PageStatus, PageType
from app.models.property import Property, PropertyStatus
from app.schemas.public import (
    PublicBlock,
    PublicBlogPost,
    PublicBlogPostListItem,
    PublicCategory,
    PublicFormSubmissionCreate,
    PublicMenu,
    PublicMenuItem,
    PublicPage,
    PublicProperty,
    PublicPropertyListItem,
    PublicSeo,
    PublicSettings,
)
from app.schemas.settings import KNOWN_SETTING_KEYS
from app.services.notification_service import NotificationService

# `POST /public/forms/{form_key}` only accepts these — matches the two real
# forms on the site (API.md); anything else is a 404, not a generic form.
ALLOWED_FORM_KEYS = {"hero_quick_enquiry", "contact_callback"}


class PublicService:
    def __init__(
        self,
        pages: PageRepository,
        blog_posts: BlogPostRepository,
        properties: PropertyRepository,
        menus: MenuRepository,
        settings: SettingsRepository,
        categories: CategoryRepository,
        media: MediaRepository,
        form_submissions: FormSubmissionRepository,
        users: UserRepository,
        notifications: NotificationService,
    ):
        self.pages = pages
        self.blog_posts = blog_posts
        self.properties = properties
        self.menus = menus
        self.settings = settings
        self.categories = categories
        self.media = media
        self.form_submissions = form_submissions
        self.users = users
        self.notifications = notifications

    async def _media_url(self, media_id: uuid.UUID | None) -> str | None:
        if not media_id:
            return None
        media = await self.media.get_by_id(media_id)
        return media.url if media else None

    @staticmethod
    def _public_category(c) -> PublicCategory:
        return PublicCategory(id=str(c.id), name=c.name, slug=c.slug)

    async def _public_seo(self, seo) -> PublicSeo | None:
        if not seo:
            return None
        return PublicSeo(
            seo_title=seo.seo_title,
            meta_description=seo.meta_description,
            keywords=seo.keywords,
            canonical_url=seo.canonical_url,
            og_title=seo.og_title,
            og_description=seo.og_description,
            og_image_url=await self._media_url(seo.og_image_media_id),
            twitter_card_type=seo.twitter_card_type,
            twitter_title=seo.twitter_title,
            twitter_description=seo.twitter_description,
            twitter_image_url=await self._media_url(seo.twitter_image_media_id),
            robots=seo.robots,
            schema_jsonld=seo.schema_jsonld,
        )

    # --- Pages ---

    async def get_page(self, page_type: PageType) -> PublicPage:
        page: Page | None = await self.pages.get_by_type(page_type)
        if not page or page.status != PageStatus.PUBLISHED:
            raise NotFoundError("Page not found.")

        blocks = [
            PublicBlock(id=str(b.id), type=b.block_definition.key, position=b.position, config=b.config)
            for b in sorted(page.blocks, key=lambda b: b.position)
        ]
        return PublicPage(
            page_type=page.page_type.value,
            slug=page.slug,
            title=page.title,
            seo=await self._public_seo(page.seo),
            blocks=blocks,
        )

    # --- Blog ---

    async def list_blog_posts(
        self, *, page: int, per_page: int, category: uuid.UUID | None, tag: uuid.UUID | None, search: str | None
    ) -> tuple[list[BlogPost], int]:
        return await self.blog_posts.list(
            page=page,
            per_page=per_page,
            status=BlogPostStatus.PUBLISHED.value,
            category_id=category,
            tag_id=tag,
            search=search,
        )

    async def get_blog_post(self, slug: str) -> BlogPost:
        post = await self.blog_posts.get_by_slug(slug)
        if not post or post.status != BlogPostStatus.PUBLISHED:
            raise NotFoundError("Post not found.")
        return post

    async def to_public_blog_post_list_item(self, post: BlogPost) -> PublicBlogPostListItem:
        return PublicBlogPostListItem(
            id=str(post.id),
            title=post.title,
            slug=post.slug,
            excerpt=post.excerpt,
            featured_image_url=await self._media_url(post.featured_image_media_id),
            author_name=post.author_name,
            category_names=[c.name for c in post.categories],
            reading_time_minutes=post.reading_time_minutes,
            is_featured=post.is_featured,
            published_at=post.published_at.isoformat() if post.published_at else None,
        )

    async def to_public_blog_post(self, post: BlogPost) -> PublicBlogPost:
        return PublicBlogPost(
            id=str(post.id),
            title=post.title,
            slug=post.slug,
            excerpt=post.excerpt,
            body=post.body,
            featured_image_url=await self._media_url(post.featured_image_media_id),
            author_name=post.author_name,
            categories=[self._public_category(c) for c in post.categories],
            tags=[self._public_category(t) for t in post.tags],
            reading_time_minutes=post.reading_time_minutes,
            is_featured=post.is_featured,
            seo=await self._public_seo(post.seo),
            published_at=post.published_at.isoformat() if post.published_at else None,
        )

    # --- Properties ---

    async def list_properties(
        self,
        *,
        page: int,
        per_page: int,
        city: str | None,
        category_id: uuid.UUID | None,
        budget_bracket: str | None,
        signature: bool | None,
    ) -> tuple[list[Property], int]:
        return await self.properties.list(
            page=page,
            per_page=per_page,
            status=PropertyStatus.PUBLISHED.value,
            city=city,
            category_id=category_id,
            budget_bracket=budget_bracket,
            is_signature=signature,
        )

    async def get_property(self, slug: str) -> Property:
        property_ = await self.properties.get_by_slug(slug)
        if not property_ or property_.status != PropertyStatus.PUBLISHED:
            raise NotFoundError("Property not found.")
        return property_

    async def to_public_property_list_item(self, property_: Property) -> PublicPropertyListItem:
        return PublicPropertyListItem(
            id=str(property_.id),
            name=property_.name,
            slug=property_.slug,
            city=property_.city,
            location_text=property_.location_text,
            type=property_.categories[0].name if property_.categories else None,
            price_display=property_.price_display,
            budget_bracket=property_.budget_bracket.value if property_.budget_bracket else None,
            spec_a=property_.spec_a,
            spec_b=property_.spec_b,
            beds_options=property_.beds_options,
            tag_text=property_.tag_text,
            status_text=property_.status_text,
            is_signature=property_.is_signature,
            featured_image_url=await self._media_url(property_.featured_image_media_id),
        )

    async def to_public_property(self, property_: Property) -> PublicProperty:
        list_item = await self.to_public_property_list_item(property_)
        gallery_urls = [
            url
            for url in [
                await self._media_url(pm.media_id) for pm in sorted(property_.gallery, key=lambda g: g.position)
            ]
            if url
        ]
        return PublicProperty(
            **list_item.model_dump(),
            area_sqft=str(property_.area_sqft) if property_.area_sqft is not None else None,
            categories=[self._public_category(c) for c in property_.categories],
            gallery=gallery_urls,
            seo=await self._public_seo(property_.seo),
        )

    # --- Menus ---

    async def get_menu(self, key: str) -> PublicMenu:
        menu = await self.menus.get_by_key(key)
        if not menu:
            raise NotFoundError("Menu not found.")

        items = await self.menus.list_items(menu.id)
        pages = await self.pages.list_all()
        slug_by_page_id = {p.id: p.slug for p in pages}

        def build(parent_id: uuid.UUID | None) -> list[PublicMenuItem]:
            children = [i for i in items if i.parent_item_id == parent_id]
            return [
                PublicMenuItem(
                    label=item.label,
                    href=(slug_by_page_id.get(item.page_id) if item.page_id else item.url) or "#",
                    is_external=item.is_external,
                    open_in_new_tab=item.open_in_new_tab,
                    children=build(item.id),
                )
                for item in children
            ]

        return PublicMenu(key=menu.key, label=menu.label, items=build(None))

    # --- Settings ---

    async def get_settings(self) -> PublicSettings:
        rows = await self.settings.get_all()
        values = {row.key: row.value for row in rows if row.key in KNOWN_SETTING_KEYS}
        return PublicSettings(
            site_name=values.get("site_name"),
            logo_url=await self._media_url(uuid.UUID(values["logo_media_id"]) if values.get("logo_media_id") else None),
            favicon_url=await self._media_url(
                uuid.UUID(values["favicon_media_id"]) if values.get("favicon_media_id") else None
            ),
            contact_email=values.get("contact_email"),
            contact_phone=values.get("contact_phone"),
            callback_phone=values.get("callback_phone"),
            whatsapp_number=values.get("whatsapp_number"),
            contact_address=values.get("contact_address"),
            social_facebook_url=values.get("social_facebook_url"),
            social_instagram_url=values.get("social_instagram_url"),
            social_linkedin_url=values.get("social_linkedin_url"),
            social_youtube_url=values.get("social_youtube_url"),
            analytics_ga_measurement_id=values.get("analytics_ga_measurement_id"),
            default_meta_title=values.get("default_meta_title"),
            default_meta_description=values.get("default_meta_description"),
            default_keywords=values.get("default_keywords"),
            default_canonical_url=values.get("default_canonical_url"),
            organization_name=values.get("organization_name"),
            google_verification_code=values.get("google_verification_code"),
            bing_verification_code=values.get("bing_verification_code"),
            google_tag_manager_id=values.get("google_tag_manager_id"),
            meta_pixel_id=values.get("meta_pixel_id"),
            google_search_console_verification=values.get("google_search_console_verification"),
            og_default_image_url=await self._media_url(uuid.UUID(values["og_default_image_media_id"]) if values.get("og_default_image_media_id") else None),
            twitter_card_default_type=values.get("twitter_card_default_type"),
            working_hours=values.get("working_hours"),
            latitude=values.get("latitude"),
            longitude=values.get("longitude"),
            service_areas=values.get("service_areas"),
        )

    async def sitemap_entries(self) -> list[dict[str, str | None]]:
        """Return only published, canonical site paths for the public-site sitemap."""
        pages = [page for page in await self.pages.list_all() if page.status == PageStatus.PUBLISHED]
        posts, _ = await self.blog_posts.list(
            page=1, per_page=50_000, status=BlogPostStatus.PUBLISHED.value,
            category_id=None, tag_id=None, author_id=None, search=None,
        )
        properties, _ = await self.properties.list(
            page=1, per_page=50_000, status=PropertyStatus.PUBLISHED.value,
            city=None, category_id=None, budget_bracket=None, is_signature=None,
        )
        entries = [
            {"path": "/" if page.page_type == PageType.HOME else page.slug, "last_modified": page.updated_at.isoformat()}
            for page in pages
        ]
        entries.extend({"path": f"/blog/{post.slug}", "last_modified": post.updated_at.isoformat()} for post in posts)
        entries.extend({"path": f"/property/{property_.slug}", "last_modified": property_.updated_at.isoformat()} for property_ in properties)
        return entries

    async def robots_txt(self) -> str:
        rows = await self.settings.get_all()
        values = {row.key: row.value for row in rows if row.key in KNOWN_SETTING_KEYS}
        content = values.get("robots_txt_content")
        if isinstance(content, str) and content.strip():
            return content.strip() + "\n"
        base_url = str(values.get("default_canonical_url") or "").rstrip("/")
        sitemap_line = f"Sitemap: {base_url}/sitemap.xml\n" if base_url else ""
        return f"User-agent: *\nAllow: /\n{sitemap_line}"

    # --- Categories ---

    async def list_categories(self, applies_to: str | None):
        return await self.categories.list_all(applies_to)

    # --- Forms ---

    async def submit_form(
        self, form_key: str, payload: PublicFormSubmissionCreate, ip_address: str | None
    ) -> FormSubmission:
        if form_key not in ALLOWED_FORM_KEYS:
            raise NotFoundError("Unknown form.")
        if not payload.name.strip():
            raise ValidationAppError("Name is required.")

        submission = FormSubmission(
            form_key=form_key,
            name=payload.name.strip(),
            phone=payload.phone,
            email=payload.email,
            property_type_interest=payload.property_type_interest,
            message=payload.message,
            ip_address=ip_address,
        )
        submission = await self.form_submissions.create(submission)

        recipients = await self.users.list_by_permission("forms.view")
        await self.notifications.notify(
            [u.id for u in recipients],
            type="form_submission",
            title="New enquiry received",
            message=f"{submission.name} submitted the {form_key.replace('_', ' ')} form.",
            link="/forms",
        )
        return submission
