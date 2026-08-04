"""Response schemas for `/public/*` (API.md) — the only surface `my-app`
calls. Deliberately flatter/leaner than the admin schemas: media references
are always resolved to real URLs (never a bare `media_id`), and there is no
`status`/`deleted_at`/audit metadata — public consumers don't need it and
shouldn't see draft state.
"""

from pydantic import BaseModel, ConfigDict


class PublicSeo(BaseModel):
    seo_title: str | None = None
    meta_description: str | None = None
    keywords: list[str] | None = None
    canonical_url: str | None = None
    og_title: str | None = None
    og_description: str | None = None
    og_image_url: str | None = None
    twitter_card_type: str | None = None
    twitter_title: str | None = None
    twitter_description: str | None = None
    twitter_image_url: str | None = None
    robots: str | None = None
    schema_jsonld: dict | None = None


class PublicBlock(BaseModel):
    id: str
    type: str
    position: int
    config: dict


class PublicPage(BaseModel):
    page_type: str
    slug: str
    title: str
    seo: PublicSeo | None
    blocks: list[PublicBlock]


class PublicCategory(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str


class PublicBlogPostListItem(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str | None
    featured_image_url: str | None
    author_name: str
    category_names: list[str]
    reading_time_minutes: int | None
    is_featured: bool
    published_at: str | None


class PublicBlogPost(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str | None
    body: str | None
    featured_image_url: str | None
    author_name: str
    categories: list[PublicCategory]
    tags: list[PublicCategory]
    reading_time_minutes: int | None
    is_featured: bool
    seo: PublicSeo | None
    published_at: str | None


class PublicPropertyListItem(BaseModel):
    id: str
    name: str
    slug: str
    city: str | None
    location_text: str | None
    type: str | None
    price_display: str | None
    budget_bracket: str | None
    spec_a: str | None
    spec_b: str | None
    beds_options: list[str] | None
    tag_text: str | None
    status_text: str | None
    is_signature: bool
    featured_image_url: str | None


class PublicPropertyAmenity(BaseModel):
    name: str
    image_url: str | None = None


class PublicProperty(PublicPropertyListItem):
    area_sqft: str | None
    description: str | None
    amenities: list[PublicPropertyAmenity]
    categories: list[PublicCategory]
    gallery: list[str]
    seo: PublicSeo | None
    map_project_id: str | None = None
    brochure_url: str | None = None


class PublicMenuItem(BaseModel):
    label: str
    href: str
    is_external: bool
    open_in_new_tab: bool
    children: list["PublicMenuItem"] = []


PublicMenuItem.model_rebuild()


class PublicMenu(BaseModel):
    key: str
    label: str
    items: list[PublicMenuItem]


class PublicSettings(BaseModel):
    site_name: str | None = None
    logo_url: str | None = None
    favicon_url: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    callback_phone: str | None = None
    whatsapp_number: str | None = None
    contact_address: str | None = None
    social_facebook_url: str | None = None
    social_instagram_url: str | None = None
    social_linkedin_url: str | None = None
    social_youtube_url: str | None = None
    analytics_ga_measurement_id: str | None = None
    default_meta_title: str | None = None
    default_meta_description: str | None = None
    default_keywords: list[str] | None = None
    default_canonical_url: str | None = None
    organization_name: str | None = None
    google_verification_code: str | None = None
    bing_verification_code: str | None = None
    google_tag_manager_id: str | None = None
    meta_pixel_id: str | None = None
    google_search_console_verification: str | None = None
    og_default_image_url: str | None = None
    twitter_card_default_type: str | None = None
    working_hours: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    service_areas: list[str] | None = None
    why_choose_image_url: str | None = None
    contact_map_image_url: str | None = None


class PublicFormSubmissionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    phone: str | None = None
    email: str | None = None
    property_type_interest: str | None = None
    message: str | None = None


class PublicCareer(BaseModel):
    id: str
    title: str
    department: str | None
    location: str | None
    employment_type: str | None
    description: str
    apply_email: str | None


class PublicGalleryItem(BaseModel):
    id: str
    image_url: str | None
    caption: str | None
    category: str | None


class PublicTestimonial(BaseModel):
    id: str
    name: str
    role_or_location: str | None
    quote: str
    photo_url: str | None
    rating: int | None
