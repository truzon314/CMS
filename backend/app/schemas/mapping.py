import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StyleRuleInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    property: str
    value: str
    action: str  # "color" | "hide"
    color: str | None = None
    opacity: float | None = None


class MapProjectCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    map_provider_type: str = "google"


class MapProjectUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = None
    map_provider_type: str | None = None
    rotate_token: bool = False


class MapProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    map_provider_type: str
    share_token: str | None = None
    created_at: datetime
    updated_at: datetime


class MapLayerStyleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stroke_color: str | None = None
    fill_color: str | None = None
    fill_opacity: float | None = Field(default=None, ge=0, le=1)
    stroke_weight: int | None = None
    default_visible: bool | None = None
    color_rules: list[StyleRuleInput] | None = None
    label_property: str | None = None
    popup_enabled: bool | None = None
    popup_properties: list[str] | None = None
    stroke_style: str | None = None  # "solid" | "dashed" | "dotted"


class MapLayerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    label: str
    stroke_color: str
    fill_color: str
    fill_opacity: float
    stroke_weight: int
    default_visible: bool
    color_rules: list[dict] | None
    label_property: str | None
    popup_enabled: bool
    popup_properties: list[str] | None
    stroke_style: str
    geojson: dict | None


class MapFeatureBatchUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    property: str
    old_value: str
    new_value: str


class MapFeatureAddProperty(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str
    default_value: str = ""


class MapFeatureRemoveProperty(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str


class MapFeatureBulkSetValue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    property: str
    value: str
    feature_indices: list[int]


class MapFeatureUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    feature_index: int | None = None
    properties: dict | None = None
    batch_update: MapFeatureBatchUpdate | None = None
    add_property: MapFeatureAddProperty | None = None
    remove_property: MapFeatureRemoveProperty | None = None
    bulk_set_value: MapFeatureBulkSetValue | None = None
    remove_feature_indices: list[int] | None = None


class MapLayerUploadRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    project_id: uuid.UUID
    label: str
    geojson: dict  # a FeatureCollection, already parsed/validated by the frontend upload proxy


class MapShareLinkUpsert(BaseModel):
    model_config = ConfigDict(extra="forbid")

    project_id: uuid.UUID
    is_active: bool | None = None
    password: str | None = None  # omit = leave as-is, null = remove, string = set/replace
    expires_at: datetime | None = None
    max_views: int | None = None
    rotate_token: bool = False


class MapShareLinkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    token: str
    is_active: bool
    has_password: bool
    expires_at: datetime | None
    max_views: int | None
    view_count: int
    created_at: datetime


class MapProviderConfigUpsert(BaseModel):
    model_config = ConfigDict(extra="forbid")

    provider_type: str
    api_key: str | None = None
    tile_url: str | None = None
    style_url: str | None = None
    attribution: str | None = None


class MapProviderConfigRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    provider_type: str
    api_key: str | None
    tile_url: str | None
    style_url: str | None
    attribution: str | None
