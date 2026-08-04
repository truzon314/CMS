import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.map_layer import MapLayer
from app.models.map_project import MapProject
from app.models.map_provider_config import MapProviderConfig
from app.models.map_share_link import MapShareLink


class SqlAlchemyMappingRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # -- projects --------------------------------------------------------

    async def list_projects(self) -> list[MapProject]:
        stmt = select(MapProject).options(selectinload(MapProject.share_link)).order_by(MapProject.created_at.desc())
        return list((await self.session.execute(stmt)).unique().scalars().all())

    async def get_project(self, project_id: uuid.UUID) -> MapProject | None:
        stmt = select(MapProject).where(MapProject.id == project_id).options(selectinload(MapProject.share_link))
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def create_project(self, project: MapProject) -> MapProject:
        self.session.add(project)
        await self.session.commit()
        await self.session.refresh(project, attribute_names=["share_link"])
        return project

    async def update_project(self, project: MapProject) -> MapProject:
        await self.session.commit()
        await self.session.refresh(project, attribute_names=["share_link"])
        return project

    async def delete_project(self, project: MapProject) -> None:
        await self.session.delete(project)
        await self.session.commit()

    # -- layers ------------------------------------------------------------

    async def list_layers(self, project_id: uuid.UUID | None = None) -> list[MapLayer]:
        stmt = select(MapLayer)
        if project_id is not None:
            stmt = stmt.where(MapLayer.project_id == project_id)
        stmt = stmt.order_by(MapLayer.created_at.asc())
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_layer(self, layer_id: uuid.UUID) -> MapLayer | None:
        return (await self.session.execute(select(MapLayer).where(MapLayer.id == layer_id))).scalar_one_or_none()

    async def create_layer(self, layer: MapLayer) -> MapLayer:
        self.session.add(layer)
        await self.session.commit()
        await self.session.refresh(layer)
        return layer

    async def update_layer(self, layer: MapLayer) -> MapLayer:
        await self.session.commit()
        await self.session.refresh(layer)
        return layer

    async def delete_layer(self, layer: MapLayer) -> None:
        await self.session.delete(layer)
        await self.session.commit()

    # -- share links ---------------------------------------------------------

    async def get_share_link_by_project(self, project_id: uuid.UUID) -> MapShareLink | None:
        stmt = select(MapShareLink).where(MapShareLink.project_id == project_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_share_link_by_token(self, token: str) -> MapShareLink | None:
        stmt = select(MapShareLink).where(MapShareLink.token == token)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def create_share_link(self, link: MapShareLink) -> MapShareLink:
        self.session.add(link)
        await self.session.commit()
        await self.session.refresh(link)
        return link

    async def update_share_link(self, link: MapShareLink) -> MapShareLink:
        await self.session.commit()
        await self.session.refresh(link)
        return link

    # -- provider configs ------------------------------------------------

    async def list_providers(self) -> list[MapProviderConfig]:
        stmt = select(MapProviderConfig).order_by(MapProviderConfig.provider_type.asc())
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_provider(self, provider_type: str) -> MapProviderConfig | None:
        stmt = select(MapProviderConfig).where(MapProviderConfig.provider_type == provider_type)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def create_provider(self, config: MapProviderConfig) -> MapProviderConfig:
        self.session.add(config)
        await self.session.commit()
        await self.session.refresh(config)
        return config

    async def update_provider(self, config: MapProviderConfig) -> MapProviderConfig:
        await self.session.commit()
        await self.session.refresh(config)
        return config

    async def delete_provider(self, config: MapProviderConfig) -> None:
        await self.session.delete(config)
        await self.session.commit()
