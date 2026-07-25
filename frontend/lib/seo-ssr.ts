import type { Metadata } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface PublicSeoResponse {
  seo_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  keywords?: string[];
  canonical_url?: string;
  robots?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  twitter_card_type?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image_url?: string;
  schema_jsonld?: Record<string, unknown>;
}

/** Server-Side Rendering (SSR) Metadata Helper for Next.js App Router */
export async function generateSsrMetadata(endpointPath: string): Promise<{ metadata: Metadata; jsonLd?: Record<string, unknown> }> {
  try {
    const res = await fetch(`${BACKEND_URL}${endpointPath}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("Failed to fetch public SEO metadata");

    const json = await res.json();
    const data: PublicSeoResponse = json.data?.seo ?? json.data ?? {};

    const title = data.seo_title || "Truzon Homes — Premium Real Estate";
    const description = data.meta_description || "Explore luxury villas and properties with Truzon Homes.";
    const keywords = data.keywords ?? (data.focus_keyword ? [data.focus_keyword] : []);
    const canonical = data.canonical_url;
    const robots = data.robots ?? "index, follow";

    const metadata: Metadata = {
      title,
      description,
      keywords,
      robots,
      alternates: canonical ? { canonical } : undefined,
      openGraph: {
        title: data.og_title || title,
        description: data.og_description || description,
        images: data.og_image_url ? [{ url: data.og_image_url }] : undefined,
      },
      twitter: {
        card: (data.twitter_card_type as "summary" | "summary_large_image") || "summary_large_image",
        title: data.twitter_title || title,
        description: data.twitter_description || description,
        images: data.twitter_image_url ? [data.twitter_image_url] : undefined,
      },
    };

    return { metadata, jsonLd: data.schema_jsonld };
  } catch (error) {
    console.error("SSR Metadata Generation Fallback:", error);
    return {
      metadata: {
        title: "Truzon Homes — Premium Real Estate",
        description: "Explore luxury villas and properties with Truzon Homes.",
      },
    };
  }
}
