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
}

export type SettingsUpdatePayload = Partial<Settings>;

export interface SettingsVersion {
  id: string;
  version_number: number;
  change_note: string | null;
  created_by: string;
  created_at: string;
}
