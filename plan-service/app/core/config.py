"""Application configuration using pydantic-settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):  # type: ignore[misc]
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "plan-service"
    app_env: str = "development"
    debug: bool = True
    log_level: str = "INFO"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database (PostgreSQL + PostGIS)
    database_url: str = "postgresql+asyncpg://electridom:electridom@localhost:5432/electridom_plans"
    database_echo: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Celery
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    # MinIO (S3-compatible storage)
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "electridom"
    minio_secret_key: str = "electridom123"
    minio_bucket: str = "plans"
    minio_secure: bool = False

    # Processing
    max_file_size_mb: int = 50
    allowed_file_types: list[str] = ["pdf", "dxf"]
    processing_timeout_seconds: int = 120

    # AI/ML (optional)
    openai_api_key: str | None = None
    openai_vision_model: str = "gpt-4o"


settings = Settings()
