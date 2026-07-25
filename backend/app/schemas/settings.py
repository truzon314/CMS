import uuid

from pydantic import BaseModel, ConfigDict

# The fixed set of known setting keys (ERD.md's `Setting` is a generic
# key-value store; this is the app-level contract for which keys exist and
# what shape their values take — matches API.md's "partial update of known
# keys" wording).
KNOWN_SETTING_KEYS = [
    "site_name",
    "logo_media_id",
    "favicon_media_id",
    "contact_email",
    "contact_phone",
    "callback_phone",
    "whatsapp_number",
    "contact_address",
    "social_facebook_url",
    "social_instagram_url",
    "social_linkedin_url",
    "social_youtube_url",
    "smtp_host",
    "smtp_port",
    "smtp_username",
    "smtp_password",
    "smtp_from_email",
    "smtp_use_tls",
    "analytics_ga_measurement_id",
    "default_meta_title",
    "default_meta_description",
    "default_keywords",
    "default_canonical_url",
    "organization_name",
    "google_verification_code",
    "bing_verification_code",
    "google_tag_manager_id",
    "meta_pixel_id",
    "google_search_console_verification",
    "og_default_image_media_id",
    "twitter_card_default_type",
    "robots_txt_content",
    "working_hours",
    "latitude",
    "longitude",
    "service_areas",
    "google_pagespeed_api_key",
    "google_gsc_service_account_json",
    "google_gsc_site_url",
    "ahrefs_api_key",
]


class SettingsRead(BaseModel):
    model_config = ConfigDict(extra="ignore")

    site_name: str | None = None
    logo_media_id: uuid.UUID | None = None
    favicon_media_id: uuid.UUID | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    callback_phone: str | None = None
    whatsapp_number: str | None = None
    contact_address: str | None = None
    social_facebook_url: str | None = None
    social_instagram_url: str | None = None
    social_linkedin_url: str | None = None
    social_youtube_url: str | None = None
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_use_tls: bool = True
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
    og_default_image_media_id: uuid.UUID | None = None
    twitter_card_default_type: str | None = "summary_large_image"
    robots_txt_content: str | None = None
    working_hours: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    service_areas: list[str] | None = None
    google_pagespeed_api_key: str | None = None
    google_gsc_service_account_json: str | None = None
    google_gsc_site_url: str | None = None
    ahrefs_api_key: str | None = None


class SettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    site_name: str | None = None
    logo_media_id: uuid.UUID | None = None
    favicon_media_id: uuid.UUID | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    callback_phone: str | None = None
    whatsapp_number: str | None = None
    contact_address: str | None = None
    social_facebook_url: str | None = None
    social_instagram_url: str | None = None
    social_linkedin_url: str | None = None
    social_youtube_url: str | None = None
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_use_tls: bool | None = None
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
    og_default_image_media_id: uuid.UUID | None = None
    twitter_card_default_type: str | None = None
    robots_txt_content: str | None = None
    working_hours: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    service_areas: list[str] | None = None
    google_pagespeed_api_key: str | None = None
    google_gsc_service_account_json: str | None = None
    google_gsc_site_url: str | None = None
    ahrefs_api_key: str | None = None
