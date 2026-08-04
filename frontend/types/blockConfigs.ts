export interface HeroSlideItem {
  heading: string;
  subheading: string;
  image_url: string;
  image_media_id?: string | null;
}

export interface HeroBannerConfig {
  button_label: string;
  button_href: string;
  slides: HeroSlideItem[];
}

export interface TextConfig {
  heading: string;
  body: string;
  image_url?: string;
  image_media_id?: string | null;
}

export interface ImageConfig {
  image_url: string;
  image_media_id?: string | null;
  alt_text: string;
  caption: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqConfig {
  heading: string;
  items: FaqItem[];
}

export interface CtaConfig {
  heading: string;
  description: string;
  button_label: string;
  button_href: string;
}

export interface GalleryImage {
  url: string;
  media_id?: string | null;
  alt_text: string;
  caption: string;
}

export interface GalleryConfig {
  heading: string;
  images: GalleryImage[];
}

export interface VideoConfig {
  heading: string;
  video_url: string;
  poster_image_url: string;
  poster_image_media_id?: string | null;
}

export interface TestimonialItem {
  name: string;
  role: string;
  quote: string;
  avatar_url: string;
  avatar_media_id?: string | null;
  rating: number;
}

export interface TestimonialsConfig {
  heading: string;
  items: TestimonialItem[];
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface FeaturesConfig {
  heading: string;
  items: FeatureItem[];
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  button_label: string;
  button_href: string;
  is_featured: boolean;
}

export interface PricingConfig {
  heading: string;
  plans: PricingPlan[];
}

export interface TeamMember {
  name: string;
  role: string;
  photo_url: string;
  photo_media_id?: string | null;
  bio: string;
}

export interface TeamConfig {
  heading: string;
  members: TeamMember[];
}

export interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

export interface TimelineConfig {
  heading: string;
  items: TimelineItem[];
}

export interface MapConfig {
  heading: string;
  address: string;
  embed_url: string;
}

export interface AccordionItem {
  title: string;
  content: string;
}

export interface AccordionConfig {
  heading: string;
  items: AccordionItem[];
}

export interface StatisticItem {
  label: string;
  value: string;
  suffix: string;
}

export interface StatisticsConfig {
  heading: string;
  items: StatisticItem[];
}

export interface ContactFormConfig {
  heading: string;
  description: string;
  form_key: "hero_quick_enquiry" | "contact_callback";
}

export interface SpacerConfig {
  height_px: number;
}

export interface DividerConfig {
  style: "solid" | "dashed" | "dotted";
}
