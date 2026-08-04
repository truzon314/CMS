"""Per-block-type config schemas. `PageBlock.config` is JSONB — validated here
against the shape for its `block_definition.key`, not treated as "any JSON"
(ERD.md, SECURITY_CHECKLIST.md §3). All 18 block types from COMPONENT_HIERARCHY.md
have a real schema as of Phase 4 (ROADMAP.md).
"""

import uuid

from pydantic import BaseModel, ConfigDict


class HeroSlideItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    subheading: str = ""
    image_url: str = ""
    image_media_id: uuid.UUID | None = None


class HeroBannerConfig(BaseModel):
    """Slideshow, not a single banner — my-app's Hero rotates through `slides`
    behind one shared button. Per-slide images are intentionally not
    usage-tracked (see `MEDIA_ID_FIELDS`'s note below), same as Gallery/
    Testimonials/Team's per-item images."""

    model_config = ConfigDict(extra="forbid")

    button_label: str = ""
    button_href: str = ""
    slides: list[HeroSlideItem] = []


class TextConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    body: str = ""
    image_url: str = ""
    image_media_id: uuid.UUID | None = None


class ImageConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    image_url: str = ""
    image_media_id: uuid.UUID | None = None
    alt_text: str = ""
    caption: str = ""


class FaqItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    q: str
    a: str


class FaqConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    items: list[FaqItem] = []


class CtaConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    description: str = ""
    button_label: str = ""
    button_href: str = ""


class GalleryImage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = ""
    media_id: uuid.UUID | None = None
    alt_text: str = ""
    caption: str = ""


class GalleryConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    images: list[GalleryImage] = []


class VideoConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    video_url: str = ""
    poster_image_url: str = ""
    poster_image_media_id: uuid.UUID | None = None


class TestimonialItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = ""
    role: str = ""
    quote: str = ""
    avatar_url: str = ""
    avatar_media_id: uuid.UUID | None = None
    rating: int = 5


class TestimonialsConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    items: list[TestimonialItem] = []


class FeatureItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    icon: str = ""
    title: str = ""
    description: str = ""


class FeaturesConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    items: list[FeatureItem] = []


class PricingPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = ""
    price: str = ""
    period: str = ""
    features: list[str] = []
    button_label: str = ""
    button_href: str = ""
    is_featured: bool = False


class PricingConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    plans: list[PricingPlan] = []


class TeamMember(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = ""
    role: str = ""
    photo_url: str = ""
    photo_media_id: uuid.UUID | None = None
    bio: str = ""


class TeamConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    members: list[TeamMember] = []


class TimelineItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    year: str = ""
    title: str = ""
    description: str = ""


class TimelineConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    items: list[TimelineItem] = []


class MapConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    address: str = ""
    embed_url: str = ""


class AccordionItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = ""
    content: str = ""


class AccordionConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    items: list[AccordionItem] = []


class StatisticItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str = ""
    value: str = ""
    suffix: str = ""


class StatisticsConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    items: list[StatisticItem] = []


class ContactFormConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading: str = ""
    description: str = ""
    form_key: str = "contact_callback"


class SpacerConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    height_px: int = 48


class DividerConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    style: str = "solid"


BLOCK_CONFIG_SCHEMAS: dict[str, type[BaseModel]] = {
    "hero_banner": HeroBannerConfig,
    "text": TextConfig,
    "image": ImageConfig,
    "gallery": GalleryConfig,
    "video": VideoConfig,
    "faq": FaqConfig,
    "testimonials": TestimonialsConfig,
    "features": FeaturesConfig,
    "pricing": PricingConfig,
    "team": TeamConfig,
    "timeline": TimelineConfig,
    "map": MapConfig,
    "accordion": AccordionConfig,
    "statistics": StatisticsConfig,
    "contact_form": ContactFormConfig,
    "cta": CtaConfig,
    "spacer": SpacerConfig,
    "divider": DividerConfig,
}

# Which config field (if any) holds a top-level `Media.id` reference for a given
# block type — drives `PageService`'s `MediaUsage` bookkeeping (ROADMAP.md Phase 3).
# Blocks with *per-item* image references (gallery images, testimonial avatars,
# team photos) intentionally aren't tracked here — usage tracking is proven via
# the single-image blocks; extending it to every nested list item is deferred.
MEDIA_ID_FIELDS: dict[str, str] = {
    "image": "image_media_id",
    "video": "poster_image_media_id",
    "text": "image_media_id",
}


def validate_block_config(block_key: str, config: dict) -> dict:
    """Returns the validated (and normalized) config dict, or raises
    pydantic.ValidationError. Block types without a schema yet (Phase 4) pass
    through unvalidated — still JSON, just not shape-checked."""
    schema = BLOCK_CONFIG_SCHEMAS.get(block_key)
    if schema is None:
        return config
    return schema.model_validate(config).model_dump(mode="json")
