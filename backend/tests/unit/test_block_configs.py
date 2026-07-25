"""Unit tests for per-block-type config validation (app/schemas/block_configs.py)
— SECURITY_CHECKLIST.md §3: unknown fields in JSONB config must be rejected,
not silently accepted."""

import pytest
from pydantic import ValidationError

from app.schemas.block_configs import validate_block_config


def test_valid_hero_banner_config_passes():
    config = validate_block_config(
        "hero_banner",
        {"button_label": "Explore", "button_href": "/projects", "slides": [{"heading": "Hi", "subheading": "There"}]},
    )
    assert config["button_label"] == "Explore"
    assert config["slides"][0]["heading"] == "Hi"


def test_unknown_field_is_rejected():
    with pytest.raises(ValidationError):
        validate_block_config("hero_banner", {"button_label": "Explore", "not_a_real_field": "sneaky"})


def test_unknown_block_key_passes_through_unvalidated():
    # Block types without a schema yet (Phase 4 note) pass through as-is.
    config = validate_block_config("some_future_block_type", {"anything": "goes"})
    assert config == {"anything": "goes"}


def test_faq_config_rejects_malformed_items():
    with pytest.raises(ValidationError):
        validate_block_config("faq", {"heading": "FAQ", "items": [{"question_typo": "?", "a": "answer"}]})
