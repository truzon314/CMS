"""Dependency-injection wiring (ARCHITECTURE.md's core/container.py). Routes depend
on the *_service functions below; each one assembles its service from repository
*implementations*, but the service classes themselves only know about the
repository *interfaces* in app/domain/repositories. Swapping an implementation
(e.g. a different DB, or a fake for tests) means changing only this file.
"""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.database.session import get_db
from app.repositories.audit_log_repository import SqlAlchemyAuditLogRepository
from app.repositories.auth_token_repository import SqlAlchemyAuthTokenRepository
from app.repositories.block_definition_repository import SqlAlchemyBlockDefinitionRepository
from app.repositories.blog_post_repository import SqlAlchemyBlogPostRepository
from app.repositories.category_repository import SqlAlchemyCategoryRepository
from app.repositories.entity_version_repository import SqlAlchemyEntityVersionRepository
from app.repositories.form_submission_repository import SqlAlchemyFormSubmissionRepository
from app.repositories.media_folder_repository import SqlAlchemyMediaFolderRepository
from app.repositories.media_repository import SqlAlchemyMediaRepository
from app.repositories.media_usage_repository import SqlAlchemyMediaUsageRepository
from app.repositories.menu_repository import SqlAlchemyMenuRepository
from app.repositories.notification_repository import SqlAlchemyNotificationRepository
from app.repositories.page_repository import SqlAlchemyPageRepository
from app.repositories.permission_repository import SqlAlchemyPermissionRepository
from app.repositories.property_repository import SqlAlchemyPropertyRepository
from app.repositories.refresh_token_repository import SqlAlchemyRefreshTokenRepository
from app.repositories.role_repository import SqlAlchemyRoleRepository
from app.repositories.settings_repository import SqlAlchemySettingsRepository
from app.repositories.tag_repository import SqlAlchemyTagRepository
from app.repositories.user_repository import SqlAlchemyUserRepository
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService
from app.services.blog_service import BlogPostService
from app.services.category_service import CategoryService
from app.services.dashboard_service import DashboardService
from app.services.form_submission_service import FormSubmissionService
from app.services.mailer_service import MailerService
from app.services.media_service import MediaService
from app.services.menu_service import MenuService
from app.services.notification_service import NotificationService
from app.services.page_service import PageService
from app.services.permission_service import PermissionService
from app.services.property_service import PropertyService
from app.services.public_service import PublicService
from app.services.role_service import RoleService
from app.services.search_service import SearchService
from app.services.seo_integrations_service import SeoIntegrationsService
from app.services.settings_service import SettingsService
from app.services.tag_service import TagService
from app.services.trash_service import TrashService
from app.services.user_service import UserService
from app.storage.base import StorageAdapter
from app.storage.local_storage import LocalStorageAdapter
from app.storage.r2_storage import R2StorageAdapter


def get_user_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyUserRepository:
    return SqlAlchemyUserRepository(session)


def get_role_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyRoleRepository:
    return SqlAlchemyRoleRepository(session)


def get_permission_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyPermissionRepository:
    return SqlAlchemyPermissionRepository(session)


def get_refresh_token_repository(
    session: AsyncSession = Depends(get_db),
) -> SqlAlchemyRefreshTokenRepository:
    return SqlAlchemyRefreshTokenRepository(session)


def get_auth_token_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyAuthTokenRepository:
    return SqlAlchemyAuthTokenRepository(session)


def get_settings_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemySettingsRepository:
    return SqlAlchemySettingsRepository(session)


def get_mailer_service(settings: SqlAlchemySettingsRepository = Depends(get_settings_repository)) -> MailerService:
    return MailerService(settings)


def get_audit_log_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyAuditLogRepository:
    return SqlAlchemyAuditLogRepository(session)


def get_audit_service(audit_logs: SqlAlchemyAuditLogRepository = Depends(get_audit_log_repository)) -> AuditService:
    return AuditService(audit_logs)


def get_notification_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyNotificationRepository:
    return SqlAlchemyNotificationRepository(session)


def get_notification_service(
    notifications: SqlAlchemyNotificationRepository = Depends(get_notification_repository),
) -> NotificationService:
    return NotificationService(notifications)


def get_auth_service(
    users: SqlAlchemyUserRepository = Depends(get_user_repository),
    refresh_tokens: SqlAlchemyRefreshTokenRepository = Depends(get_refresh_token_repository),
    auth_tokens: SqlAlchemyAuthTokenRepository = Depends(get_auth_token_repository),
    mailer: MailerService = Depends(get_mailer_service),
    audit: AuditService = Depends(get_audit_service),
) -> AuthService:
    return AuthService(users, refresh_tokens, auth_tokens, mailer, audit)


def get_user_service(
    users: SqlAlchemyUserRepository = Depends(get_user_repository),
    roles: SqlAlchemyRoleRepository = Depends(get_role_repository),
    auth_tokens: SqlAlchemyAuthTokenRepository = Depends(get_auth_token_repository),
    audit: AuditService = Depends(get_audit_service),
) -> UserService:
    return UserService(users, roles, auth_tokens, audit)


def get_role_service(
    roles: SqlAlchemyRoleRepository = Depends(get_role_repository),
    permissions: SqlAlchemyPermissionRepository = Depends(get_permission_repository),
    session: AsyncSession = Depends(get_db),
    audit: AuditService = Depends(get_audit_service),
) -> RoleService:
    return RoleService(roles, permissions, session, audit)


def get_permission_service(
    permissions: SqlAlchemyPermissionRepository = Depends(get_permission_repository),
) -> PermissionService:
    return PermissionService(permissions)


def get_page_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyPageRepository:
    return SqlAlchemyPageRepository(session)


def get_block_definition_repository(
    session: AsyncSession = Depends(get_db),
) -> SqlAlchemyBlockDefinitionRepository:
    return SqlAlchemyBlockDefinitionRepository(session)


def get_entity_version_repository(
    session: AsyncSession = Depends(get_db),
) -> SqlAlchemyEntityVersionRepository:
    return SqlAlchemyEntityVersionRepository(session)


def get_media_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyMediaRepository:
    return SqlAlchemyMediaRepository(session)


def get_media_folder_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyMediaFolderRepository:
    return SqlAlchemyMediaFolderRepository(session)


def get_media_usage_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyMediaUsageRepository:
    return SqlAlchemyMediaUsageRepository(session)


def get_page_service(
    pages: SqlAlchemyPageRepository = Depends(get_page_repository),
    block_definitions: SqlAlchemyBlockDefinitionRepository = Depends(get_block_definition_repository),
    versions: SqlAlchemyEntityVersionRepository = Depends(get_entity_version_repository),
    media_usage: SqlAlchemyMediaUsageRepository = Depends(get_media_usage_repository),
    audit: AuditService = Depends(get_audit_service),
) -> PageService:
    return PageService(pages, block_definitions, versions, media_usage, audit)


def get_storage_adapter() -> StorageAdapter:
    return R2StorageAdapter() if get_settings().r2_configured else LocalStorageAdapter()


def get_media_service(
    media: SqlAlchemyMediaRepository = Depends(get_media_repository),
    folders: SqlAlchemyMediaFolderRepository = Depends(get_media_folder_repository),
    usage: SqlAlchemyMediaUsageRepository = Depends(get_media_usage_repository),
    storage: StorageAdapter = Depends(get_storage_adapter),
    audit: AuditService = Depends(get_audit_service),
) -> MediaService:
    return MediaService(media, folders, usage, storage, audit)


def get_category_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyCategoryRepository:
    return SqlAlchemyCategoryRepository(session)


def get_tag_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyTagRepository:
    return SqlAlchemyTagRepository(session)


def get_category_service(
    categories: SqlAlchemyCategoryRepository = Depends(get_category_repository),
) -> CategoryService:
    return CategoryService(categories)


def get_tag_service(tags: SqlAlchemyTagRepository = Depends(get_tag_repository)) -> TagService:
    return TagService(tags)


def get_blog_post_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyBlogPostRepository:
    return SqlAlchemyBlogPostRepository(session)


def get_blog_service(
    posts: SqlAlchemyBlogPostRepository = Depends(get_blog_post_repository),
    categories: SqlAlchemyCategoryRepository = Depends(get_category_repository),
    tags: SqlAlchemyTagRepository = Depends(get_tag_repository),
    versions: SqlAlchemyEntityVersionRepository = Depends(get_entity_version_repository),
    media_usage: SqlAlchemyMediaUsageRepository = Depends(get_media_usage_repository),
    audit: AuditService = Depends(get_audit_service),
) -> BlogPostService:
    return BlogPostService(posts, categories, tags, versions, media_usage, audit)


def get_property_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyPropertyRepository:
    return SqlAlchemyPropertyRepository(session)


def get_property_service(
    properties: SqlAlchemyPropertyRepository = Depends(get_property_repository),
    categories: SqlAlchemyCategoryRepository = Depends(get_category_repository),
    media_usage: SqlAlchemyMediaUsageRepository = Depends(get_media_usage_repository),
    audit: AuditService = Depends(get_audit_service),
) -> PropertyService:
    return PropertyService(properties, categories, media_usage, audit)


def get_menu_repository(session: AsyncSession = Depends(get_db)) -> SqlAlchemyMenuRepository:
    return SqlAlchemyMenuRepository(session)


def get_menu_service(
    menus: SqlAlchemyMenuRepository = Depends(get_menu_repository),
    audit: AuditService = Depends(get_audit_service),
) -> MenuService:
    return MenuService(menus, audit)


def get_form_submission_repository(
    session: AsyncSession = Depends(get_db),
) -> SqlAlchemyFormSubmissionRepository:
    return SqlAlchemyFormSubmissionRepository(session)


def get_form_submission_service(
    submissions: SqlAlchemyFormSubmissionRepository = Depends(get_form_submission_repository),
    audit: AuditService = Depends(get_audit_service),
) -> FormSubmissionService:
    return FormSubmissionService(submissions, audit)


def get_settings_service(
    settings: SqlAlchemySettingsRepository = Depends(get_settings_repository),
    versions: SqlAlchemyEntityVersionRepository = Depends(get_entity_version_repository),
    audit: AuditService = Depends(get_audit_service),
) -> SettingsService:
    return SettingsService(settings, versions, audit)


def get_public_service(
    pages: SqlAlchemyPageRepository = Depends(get_page_repository),
    blog_posts: SqlAlchemyBlogPostRepository = Depends(get_blog_post_repository),
    properties: SqlAlchemyPropertyRepository = Depends(get_property_repository),
    menus: SqlAlchemyMenuRepository = Depends(get_menu_repository),
    settings: SqlAlchemySettingsRepository = Depends(get_settings_repository),
    categories: SqlAlchemyCategoryRepository = Depends(get_category_repository),
    media: SqlAlchemyMediaRepository = Depends(get_media_repository),
    form_submissions: SqlAlchemyFormSubmissionRepository = Depends(get_form_submission_repository),
    users: SqlAlchemyUserRepository = Depends(get_user_repository),
    notifications: NotificationService = Depends(get_notification_service),
) -> PublicService:
    return PublicService(
        pages, blog_posts, properties, menus, settings, categories, media, form_submissions, users, notifications
    )


def get_search_service(
    pages: SqlAlchemyPageRepository = Depends(get_page_repository),
    posts: SqlAlchemyBlogPostRepository = Depends(get_blog_post_repository),
    properties: SqlAlchemyPropertyRepository = Depends(get_property_repository),
    media: SqlAlchemyMediaRepository = Depends(get_media_repository),
    users: SqlAlchemyUserRepository = Depends(get_user_repository),
) -> SearchService:
    return SearchService(pages, posts, properties, media, users)


def get_trash_service(
    posts: SqlAlchemyBlogPostRepository = Depends(get_blog_post_repository),
    properties: SqlAlchemyPropertyRepository = Depends(get_property_repository),
    media: SqlAlchemyMediaRepository = Depends(get_media_repository),
    audit: AuditService = Depends(get_audit_service),
) -> TrashService:
    return TrashService(posts, properties, media, audit)


def get_dashboard_service(
    session: AsyncSession = Depends(get_db),
) -> DashboardService:
    return DashboardService(session)


def get_seo_integrations_service(
    settings: SqlAlchemySettingsRepository = Depends(get_settings_repository),
) -> SeoIntegrationsService:
    return SeoIntegrationsService(settings)
