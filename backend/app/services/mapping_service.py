import secrets
import uuid

from sqlalchemy.orm.attributes import flag_modified

from app.domain.repositories.mapping_repository import MappingRepository
from app.models.map_layer import MapLayer
from app.models.map_project import MapProject
from app.models.map_provider_config import MapProviderConfig
from app.models.map_share_link import MapShareLink
from app.schemas.mapping import (
    MapFeatureUpdate,
    MapLayerStyleUpdate,
    MapLayerUploadRequest,
    MapProjectCreate,
    MapProjectUpdate,
    MapProviderConfigUpsert,
    MapShareLinkUpsert,
)
from app.services.audit_service import AuditService
from app.shared.exceptions.exceptions import NotFoundError, ValidationAppError
from app.shared.security.security import hash_password, verify_password

# Same 10-color rotation the old Next.js layerStore used, kept identical so
# newly-uploaded layers look the same as before this moved server-side.
LAYER_COLOR_PALETTE = [
    "#0EA5E9", "#22C55E", "#F97316", "#A855F7", "#EF4444",
    "#EAB308", "#14B8A6", "#EC4899", "#6366F1", "#84CC16",
]


def _new_token() -> str:
    return secrets.token_urlsafe(18)


class MappingService:
    def __init__(self, repo: MappingRepository, audit: AuditService):
        self.repo = repo
        self.audit = audit

    # -- projects ----------------------------------------------------------

    async def list_projects(self) -> list[MapProject]:
        return await self.repo.list_projects()

    async def get_project(self, project_id: uuid.UUID) -> MapProject:
        project = await self.repo.get_project(project_id)
        if not project:
            raise NotFoundError("Project not found.")
        return project

    async def create_project(self, payload: MapProjectCreate, actor_id: uuid.UUID | None = None) -> MapProject:
        project = MapProject(name=payload.name, map_provider_type=payload.map_provider_type)
        project = await self.repo.create_project(project)
        # Every project gets a share link up front, matching the old
        # createProject behavior (ShareLinkModal expects one to already exist).
        # Assigned directly rather than re-fetched: `project` was already
        # refreshed with share_link=None (before the link existed), and a
        # second selectinload query on the same identity-mapped object
        # doesn't reliably overwrite that already-loaded attribute.
        link = MapShareLink(project_id=project.id, token=_new_token())
        link = await self.repo.create_share_link(link)
        project.share_link = link
        await self.audit.log(actor_id, "mapping.create_project", "map_project", project.id, details={"name": project.name})
        return project

    async def update_project(
        self, project_id: uuid.UUID, payload: MapProjectUpdate, actor_id: uuid.UUID | None = None
    ) -> MapProject:
        project = await self.get_project(project_id)
        if payload.name is not None:
            project.name = payload.name
        if payload.map_provider_type is not None:
            project.map_provider_type = payload.map_provider_type
        project = await self.repo.update_project(project)

        if payload.rotate_token:
            link = await self.repo.get_share_link_by_project(project_id)
            if link:
                link.token = _new_token()
                await self.repo.update_share_link(link)
                project = await self.repo.get_project(project_id)

        await self.audit.log(actor_id, "mapping.update_project", "map_project", project.id)
        return project

    async def delete_project(self, project_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> None:
        project = await self.get_project(project_id)
        await self.repo.delete_project(project)
        await self.audit.log(actor_id, "mapping.delete_project", "map_project", project_id, details={"name": project.name})

    # -- layers ------------------------------------------------------------

    async def list_layers(self, project_id: uuid.UUID | None = None) -> list[MapLayer]:
        return await self.repo.list_layers(project_id)

    async def get_layer(self, layer_id: uuid.UUID) -> MapLayer:
        layer = await self.repo.get_layer(layer_id)
        if not layer:
            raise NotFoundError("Layer not found.")
        return layer

    async def upload_layer(self, payload: MapLayerUploadRequest, actor_id: uuid.UUID | None = None) -> MapLayer:
        # Confirms the project exists before attaching a layer to it.
        await self.get_project(payload.project_id)

        existing_count = len(await self.repo.list_layers(payload.project_id))
        color = LAYER_COLOR_PALETTE[existing_count % len(LAYER_COLOR_PALETTE)]

        layer = MapLayer(
            project_id=payload.project_id,
            label=payload.label,
            stroke_color=color,
            fill_color=color,
            geojson=payload.geojson,
        )
        layer = await self.repo.create_layer(layer)
        feature_count = len(payload.geojson.get("features", []))
        await self.audit.log(
            actor_id, "mapping.upload_layer", "map_layer", layer.id,
            details={"label": layer.label, "project_id": str(payload.project_id), "features": feature_count},
        )
        return layer

    async def update_layer_style(
        self, layer_id: uuid.UUID, payload: MapLayerStyleUpdate, actor_id: uuid.UUID | None = None
    ) -> MapLayer:
        layer = await self.get_layer(layer_id)
        patch = payload.model_dump(exclude_unset=True)
        if "color_rules" in patch and patch["color_rules"] is not None:
            patch["color_rules"] = [r if isinstance(r, dict) else r.model_dump() for r in payload.color_rules]
        for field, value in patch.items():
            setattr(layer, field, value)
        return await self.repo.update_layer(layer)

    async def delete_layer(self, layer_id: uuid.UUID, actor_id: uuid.UUID | None = None) -> None:
        layer = await self.get_layer(layer_id)
        await self.repo.delete_layer(layer)
        await self.audit.log(actor_id, "mapping.delete_layer", "map_layer", layer_id, details={"label": layer.label})

    async def update_layer_features(
        self, layer_id: uuid.UUID, payload: MapFeatureUpdate, actor_id: uuid.UUID | None = None
    ) -> dict:
        layer = await self.get_layer(layer_id)
        geojson = layer.geojson or {"type": "FeatureCollection", "features": []}
        features = geojson.get("features")
        if not isinstance(features, list):
            raise ValidationAppError("Layer has no valid GeoJSON features.")

        if payload.remove_feature_indices is not None:
            indices = sorted(set(payload.remove_feature_indices), reverse=True)
            removed = 0
            for idx in indices:
                if 0 <= idx < len(features):
                    del features[idx]
                    removed += 1
            geojson["features"] = features
            layer.geojson = geojson
            flag_modified(layer, "geojson")
            await self.repo.update_layer(layer)
            return {"ok": True, "removed_count": removed}

        if payload.add_property is not None:
            key = payload.add_property.key.strip()
            if not key:
                raise ValidationAppError("Attribute name is required.")
            default_value = payload.add_property.default_value
            added_count = 0
            for feature in features:
                props = feature.get("properties") or {}
                if key not in props:
                    props[key] = default_value
                    feature["properties"] = props
                    added_count += 1
            geojson["features"] = features
            layer.geojson = geojson
            flag_modified(layer, "geojson")
            await self.repo.update_layer(layer)
            return {"ok": True, "added_count": added_count, "key": key}

        if payload.remove_property is not None:
            key = payload.remove_property.key
            removed_count = 0
            for feature in features:
                props = feature.get("properties") or {}
                if key in props:
                    del props[key]
                    feature["properties"] = props
                    removed_count += 1
            geojson["features"] = features
            layer.geojson = geojson
            flag_modified(layer, "geojson")
            await self.repo.update_layer(layer)
            return {"ok": True, "removed_count": removed_count, "key": key}

        if payload.bulk_set_value is not None:
            prop = payload.bulk_set_value.property
            value = payload.bulk_set_value.value
            updated_count = 0
            for idx in set(payload.bulk_set_value.feature_indices):
                if 0 <= idx < len(features):
                    props = features[idx].get("properties") or {}
                    props[prop] = value
                    features[idx]["properties"] = props
                    updated_count += 1
            geojson["features"] = features
            layer.geojson = geojson
            flag_modified(layer, "geojson")
            await self.repo.update_layer(layer)
            return {"ok": True, "updated_count": updated_count}

        if payload.batch_update is not None:
            updated_count = 0
            for feature in features:
                props = feature.get("properties") or {}
                if str(props.get(payload.batch_update.property)) == payload.batch_update.old_value:
                    props[payload.batch_update.property] = payload.batch_update.new_value
                    feature["properties"] = props
                    updated_count += 1
            geojson["features"] = features
            layer.geojson = geojson
            # `geojson` is the same dict object layer.geojson already
            # referenced, mutated in place — SQLAlchemy's default change
            # tracking has no distinct "old" snapshot to diff against, so a
            # plain reassignment silently produces no UPDATE. flag_modified
            # forces the column dirty regardless.
            flag_modified(layer, "geojson")
            await self.repo.update_layer(layer)
            return {"ok": True, "updated_count": updated_count}

        if payload.feature_index is None or payload.properties is None:
            raise ValidationAppError("Either batch_update or feature_index+properties is required.")
        if payload.feature_index < 0 or payload.feature_index >= len(features):
            raise NotFoundError("Feature not found in layer.")

        features[payload.feature_index]["properties"] = payload.properties
        geojson["features"] = features
        layer.geojson = geojson
        flag_modified(layer, "geojson")
        await self.repo.update_layer(layer)
        return {"ok": True, "feature_index": payload.feature_index, "updated_feature": features[payload.feature_index]}

    # -- share links ---------------------------------------------------------

    async def get_share_link_for_project(self, project_id: uuid.UUID) -> MapShareLink | None:
        return await self.repo.get_share_link_by_project(project_id)

    async def upsert_share_link(
        self, payload: MapShareLinkUpsert, actor_id: uuid.UUID | None = None
    ) -> MapShareLink:
        await self.get_project(payload.project_id)  # 404s if unknown
        link = await self.repo.get_share_link_by_project(payload.project_id)
        if link is None:
            link = MapShareLink(project_id=payload.project_id, token=_new_token())
            link = await self.repo.create_share_link(link)

        if payload.rotate_token:
            link.token = _new_token()
        if payload.is_active is not None:
            link.is_active = payload.is_active
        if payload.password is not None:
            link.password_hash = hash_password(payload.password) if payload.password else None
        if payload.expires_at is not None:
            link.expires_at = payload.expires_at
        if payload.max_views is not None:
            link.max_views = payload.max_views

        link = await self.repo.update_share_link(link)
        await self.audit.log(
            actor_id, "mapping.update_share_link", "map_share_link", link.id,
            details={"project_id": str(payload.project_id), "is_active": link.is_active, "has_password": bool(link.password_hash)},
        )
        return link

    async def resolve_public_project(
        self, token: str, password: str | None, *, count_view: bool = True
    ) -> tuple[MapProject, list[MapLayer]]:
        """Public, unauthenticated share-link resolution — enforces active /
        expiry / view-limit / password exactly like the admin panel's share
        settings configured. `count_view` should only be True for the
        top-level project fetch — per-layer geojson requests reuse this same
        validation but must not each add their own view, matching the old
        behavior where only the initial /shared/[token] hit counted a view."""
        link = await self.repo.get_share_link_by_token(token)
        if not link or not link.is_active:
            raise NotFoundError("Share link disabled or invalid.")

        from datetime import datetime, timezone

        if link.expires_at and datetime.now(timezone.utc) > link.expires_at:
            raise NotFoundError("Share link has expired.")
        if link.max_views is not None and link.max_views > 0 and link.view_count >= link.max_views:
            raise NotFoundError("Share link maximum view limit reached.")
        if link.password_hash:
            if not password or not verify_password(password, link.password_hash):
                raise ValidationAppError("Incorrect or missing password.")

        project = await self.get_project(link.project_id)
        if count_view:
            link.view_count += 1
            await self.repo.update_share_link(link)
        layers = await self.repo.list_layers(project.id)
        return project, layers

    # -- provider configs ------------------------------------------------

    async def list_providers(self) -> list[MapProviderConfig]:
        return await self.repo.list_providers()

    async def upsert_provider(
        self, payload: MapProviderConfigUpsert, actor_id: uuid.UUID | None = None
    ) -> MapProviderConfig:
        config = await self.repo.get_provider(payload.provider_type)
        if config is None:
            config = MapProviderConfig(provider_type=payload.provider_type)
            config.api_key = payload.api_key
            config.tile_url = payload.tile_url
            config.style_url = payload.style_url
            config.attribution = payload.attribution
            config = await self.repo.create_provider(config)
        else:
            config.api_key = payload.api_key
            config.tile_url = payload.tile_url
            config.style_url = payload.style_url
            config.attribution = payload.attribution
            config = await self.repo.update_provider(config)

        await self.audit.log(actor_id, "mapping.update_provider", "map_provider_config", config.id, details={"provider_type": payload.provider_type})
        return config

    async def delete_provider(self, provider_type: str, actor_id: uuid.UUID | None = None) -> None:
        config = await self.repo.get_provider(provider_type)
        if not config:
            raise NotFoundError("Provider config not found.")
        await self.repo.delete_provider(config)
        await self.audit.log(actor_id, "mapping.delete_provider", "map_provider_config", config.id, details={"provider_type": provider_type})
