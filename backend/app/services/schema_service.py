from typing import Any
from app.models.blog_post import BlogPost
from app.models.page import Page
from app.models.property import Property


class SchemaService:
    @staticmethod
    def generate_organization_schema(settings_map: dict[str, Any], site_url: str = "https://truzonhomes.com") -> dict:
        org_name = settings_map.get("organization_name") or settings_map.get("site_name") or "Truzon Homes"
        return {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": org_name,
            "url": site_url,
            "logo": f"{site_url}/logo.png",
            "contactPoint": [
                {
                    "@type": "ContactPoint",
                    "telephone": settings_map.get("contact_phone", ""),
                    "contactType": "customer service",
                    "email": settings_map.get("contact_email", ""),
                }
            ],
            "sameAs": [
                url for url in [
                    settings_map.get("social_facebook_url"),
                    settings_map.get("social_instagram_url"),
                    settings_map.get("social_linkedin_url"),
                    settings_map.get("social_youtube_url"),
                ] if url
            ],
        }

    @staticmethod
    def generate_local_business_schema(settings_map: dict[str, Any], site_url: str = "https://truzonhomes.com") -> dict:
        org_name = settings_map.get("organization_name") or "Truzon Homes"
        schema: dict[str, Any] = {
            "@context": "https://schema.org",
            "@type": ["LocalBusiness", "RealEstateAgent"],
            "name": org_name,
            "image": f"{site_url}/logo.png",
            "url": site_url,
            "telephone": settings_map.get("contact_phone", ""),
            "email": settings_map.get("contact_email", ""),
            "address": {
                "@type": "PostalAddress",
                "streetAddress": settings_map.get("contact_address", ""),
                "addressLocality": "Hyderabad",
                "addressRegion": "Telangana",
                "addressCountry": "IN",
            },
        }

        lat = settings_map.get("latitude")
        lng = settings_map.get("longitude")
        if lat is not None and lng is not None:
            schema["geo"] = {
                "@type": "GeoCoordinates",
                "latitude": float(lat),
                "longitude": float(lng),
            }

        hours = settings_map.get("working_hours")
        if hours:
            schema["openingHours"] = hours

        areas = settings_map.get("service_areas")
        if areas and isinstance(areas, list):
            schema["areaServed"] = areas

        return schema

    @staticmethod
    def generate_website_schema(settings_map: dict[str, Any], site_url: str = "https://truzonhomes.com") -> dict:
        site_name = settings_map.get("site_name") or "Truzon Homes"
        return {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": site_name,
            "url": site_url,
            "potentialAction": {
                "@type": "SearchAction",
                "target": f"{site_url}/search?q={{search_term_string}}",
                "query-input": "required name=search_term_string",
            },
        }

    @staticmethod
    def generate_article_schema(post: BlogPost, site_url: str = "https://truzonhomes.com") -> dict:
        seo = post.seo
        title = (seo and seo.seo_title) or post.title
        desc = (seo and seo.meta_description) or post.excerpt or ""
        author_name = post.author.full_name if post.author else "Truzon Editorial Team"

        return {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": title,
            "description": desc,
            "author": {
                "@type": "Person",
                "name": author_name,
            },
            "publisher": {
                "@type": "Organization",
                "name": "Truzon Homes",
                "logo": {
                    "@type": "ImageObject",
                    "url": f"{site_url}/logo.png",
                },
            },
            "datePublished": post.published_at.isoformat() if post.published_at else post.created_at.isoformat(),
            "dateModified": post.updated_at.isoformat(),
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": f"{site_url}/blog/{post.slug}",
            },
        }

    @staticmethod
    def generate_property_schema(prop: Property, site_url: str = "https://truzonhomes.com") -> dict:
        seo = prop.seo
        title = (seo and seo.seo_title) or prop.title
        desc = (seo and seo.meta_description) or prop.description or ""

        return {
            "@context": "https://schema.org",
            "@type": ["Product", "RealEstateListing"],
            "name": title,
            "description": desc,
            "category": "Real Estate",
            "offers": {
                "@type": "Offer",
                "priceCurrency": "INR",
                "price": prop.price_range_raw if hasattr(prop, "price_range_raw") else "Contact for Price",
                "availability": "https://schema.org/InStock",
                "url": f"{site_url}/property/{prop.slug}",
            },
        }

    @staticmethod
    def generate_faq_schema(faq_items: list[dict]) -> dict:
        main_entities = []
        for item in faq_items:
            question = item.get("q") or item.get("question")
            answer = item.get("a") or item.get("answer")
            if question and answer:
                main_entities.append({
                    "@type": "Question",
                    "name": question,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": answer,
                    },
                })

        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": main_entities,
        }
