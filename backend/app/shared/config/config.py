from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    environment: str = "development"
    cors_origins: str = "http://localhost:3001,http://localhost:3000,http://127.0.0.1:3001,http://127.0.0.1:3000"
    # Base URL of the CMS admin frontend — used to build clickable links in
    # transactional emails (user invites, password resets), since those are
    # sent from the backend and have no request-derived Origin to go on.
    admin_frontend_url: str = "http://localhost:3001"

    # Media Library (ARCHITECTURE.md's `StorageAdapter` — local disk for dev/tests,
    # R2 in prod once these are set).
    media_storage_dir: str = "./media_storage"
    public_media_base_url: str = "http://localhost:8000"
    max_image_upload_mb: int = 25
    max_video_upload_mb: int = 200
    r2_account_id: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    r2_bucket: str | None = None
    r2_public_base_url: str | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def r2_configured(self) -> bool:
        return bool(self.r2_account_id and self.r2_access_key_id and self.r2_secret_access_key and self.r2_bucket)


@lru_cache
def get_settings() -> Settings:
    return Settings()
