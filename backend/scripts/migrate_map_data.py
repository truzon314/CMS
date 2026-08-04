"""One-time migration of the old map-management module's local JSON/GeoJSON
data (frontend/data/projects.json, layers.json, geojson/*.geojson) into the
real map_project / map_layer Postgres tables now backing it.

Multi-tenant ownership (projects.json's `ownerId`) is dropped — the new
schema has no company/account scoping, so every migrated project becomes
part of the one shared workspace.

Note: `projects.json` currently has 8 entries, but only 2 look like real
content ("Rainbow VIllas", "Heaven City") — the other 6 ("Diagnostic Probe
Project", "Probe Project 2".."6") look like leftover test data from
development. This script migrates all 8 faithfully rather than guessing
which to skip; delete the ones you don't want afterward from the
map-management admin UI (now backed by a real DELETE endpoint) or edit the
PROJECT skip-list below before running.

Safe to re-run: skipped if `map_project` already has any rows (see `main`).

Run from `truzon-cms/backend`:
    python -m scripts.migrate_map_data
"""

import asyncio
import json
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select

from app.models.map_layer import MapLayer
from app.models.map_project import MapProject
from app.models.map_share_link import MapShareLink
from app.shared.database.session import AsyncSessionLocal

FRONTEND_DATA_DIR = Path(__file__).resolve().parents[2] / "frontend" / "data"
PROJECTS_FILE = FRONTEND_DATA_DIR / "projects.json"
LAYERS_FILE = FRONTEND_DATA_DIR / "layers.json"
GEOJSON_DIR = FRONTEND_DATA_DIR / "geojson"

# Add old project slugs here to exclude them from migration, e.g.:
# SKIP_PROJECT_IDS = {"diagnostic-probe-project", "probe-project-2", ...}
SKIP_PROJECT_IDS: set[str] = set()


async def main() -> None:
    async with AsyncSessionLocal() as session:
        existing = (await session.execute(select(MapProject.id).limit(1))).first()
        if existing:
            print("map_project already has rows — skipping migration (safe re-run guard).")
            return

        projects_raw = json.loads(PROJECTS_FILE.read_text(encoding="utf-8"))
        layers_raw = json.loads(LAYERS_FILE.read_text(encoding="utf-8"))

        old_to_new_project_id: dict[str, object] = {}
        projects_migrated = 0
        share_links_migrated = 0

        for p in projects_raw:
            if p["id"] in SKIP_PROJECT_IDS:
                continue
            new_id = uuid4()
            old_to_new_project_id[p["id"]] = new_id
            session.add(
                MapProject(
                    id=new_id,
                    name=p["name"],
                    map_provider_type=p.get("mapProviderType") or "google",
                )
            )
            if p.get("shareToken"):
                session.add(
                    MapShareLink(
                        project_id=new_id,
                        token=p["shareToken"],
                    )
                )
                share_links_migrated += 1
            projects_migrated += 1

        layers_migrated = 0
        layers_skipped: list[str] = []

        for l in layers_raw:
            new_project_id = old_to_new_project_id.get(l["projectId"])
            if new_project_id is None:
                continue  # belongs to a skipped project

            geojson_path = GEOJSON_DIR / f"{l['id']}.geojson"
            geojson = None
            if geojson_path.exists():
                try:
                    geojson = json.loads(geojson_path.read_text(encoding="utf-8"))
                except json.JSONDecodeError:
                    layers_skipped.append(f"{l['id']} (bad geojson)")

            session.add(
                MapLayer(
                    project_id=new_project_id,
                    label=l["label"],
                    stroke_color=l.get("strokeColor") or "#0EA5E9",
                    fill_color=l.get("fillColor") or "#0EA5E9",
                    fill_opacity=l.get("fillOpacity", 0.4),
                    stroke_weight=l.get("strokeWeight", 2),
                    default_visible=l.get("defaultVisible", True),
                    color_rules=l.get("colorRules") or None,
                    label_property=l.get("labelProperty") or None,
                    popup_enabled=l.get("popupEnabled", True),
                    popup_properties=l.get("popupProperties") or None,
                    stroke_style=l.get("strokeStyle") or "solid",
                    geojson=geojson,
                )
            )
            layers_migrated += 1

        await session.commit()

        print(f"Migrated {projects_migrated} project(s), {share_links_migrated} share link(s), {layers_migrated} layer(s).")
        if layers_skipped:
            print(f"Layers with missing/invalid geojson (created with geojson=null): {', '.join(layers_skipped)}")


if __name__ == "__main__":
    asyncio.run(main())
