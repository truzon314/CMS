export interface Settings {
  site_name: string | null;
  logo_media_id: string | null;
  favicon_media_id: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  callback_phone: string | null;
  whatsapp_number: string | null;
  contact_address: string | null;
  social_facebook_url: string | null;
  social_instagram_url: string | null;
  social_linkedin_url: string | null;
  social_youtube_url: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_password: string | null;
  smtp_from_email: string | null;
  smtp_use_tls: boolean;
  analytics_ga_measurement_id: string | null;
  default_meta_title: string | null;
  default_meta_description: string | null;
  default_keywords: string[] | null;
  default_canonical_url: string | null;
  organization_name: string | null;
  google_verification_code: string | null;
  bing_verification_code: string | null;
  google_tag_manager_id: string | null;
  meta_pixel_id: string | null;
  google_search_console_verification: string | null;
  og_default_image_media_id: string | null;
  twitter_card_default_type: string | null;
  robots_txt_content: string | null;
  working_hours: string | null;
  latitude: number | null;
  longitude: number | null;
  service_areas: string[] | null;
  google_pagespeed_api_key: string | null;
  google_gsc_service_account_json: string | null;
  google_gsc_site_url: string | null;
  ahrefs_api_key: string | null;
  why_choose_image_media_id: string | null;
  contact_map_image_media_id: string | null;
}

export type SettingsUpdatePayload = Partial<Settings>;

export interface SettingsVersion {
  id: string;
  version_number: number;
  change_note: string | null;
  created_by: string;
  created_at: string;
}
