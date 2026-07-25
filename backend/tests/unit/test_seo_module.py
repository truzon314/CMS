import pytest
from app.services.schema_service import SchemaService


def test_schema_service_organization_generation():
    settings = {
        "site_name": "Truzon Homes",
        "organization_name": "Truzon Real Estate Pvt Ltd",
        "contact_phone": "+91 98480 12345",
        "contact_email": "info@truzonhomes.com",
        "social_facebook_url": "https://facebook.com/truzonhomes",
    }
    schema = SchemaService.generate_organization_schema(settings)
    assert schema["@type"] == "Organization"
    assert schema["name"] == "Truzon Real Estate Pvt Ltd"
    assert "https://facebook.com/truzonhomes" in schema["sameAs"]


def test_schema_service_faq_generation():
    items = [
        {"q": "How to book?", "a": "Call our sales team."},
        {"q": "Is RERA approved?", "a": "Yes, 100% RERA approved."},
    ]
    schema = SchemaService.generate_faq_schema(items)
    assert schema["@type"] == "FAQPage"
    assert len(schema["mainEntity"]) == 2
    assert schema["mainEntity"][0]["name"] == "How to book?"
