"""Health check endpoint — verifies connectivity to all dependencies."""

from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_storage
from app.core.config import settings
from app.core.storage import StorageService

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(
    db: AsyncSession = Depends(get_db),
    storage_service: StorageService = Depends(get_storage),
) -> dict:
    """Check health of all service dependencies.

    Verifies connectivity to:
    - PostgreSQL database
    - MinIO object storage
    - Redis cache/broker
    """
    checks: dict[str, str] = {}

    # Check database
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {e}"

    # Check MinIO
    try:
        storage_service.ensure_bucket()
        checks["minio"] = "ok"
    except Exception as e:
        checks["minio"] = f"error: {e}"

    # Check Redis
    redis_client: Redis | None = None
    try:
        redis_client = Redis.from_url(settings.redis_url)
        await redis_client.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {e}"
    finally:
        if redis_client is not None:
            try:
                await redis_client.close()
            except Exception:
                pass

    status = "ok" if all(v == "ok" for v in checks.values()) else "degraded"

    return {"status": status, "checks": checks}


@router.get("/health/ai")
async def ai_health_check() -> dict:
    """Check AI/Vision API availability and usage stats."""
    from app.services.ai.vision_classifier import get_daily_stats

    stats = get_daily_stats()
    return {
        "status": "ok" if stats["api_configured"] else "not_configured",
        "stats": stats,
    }
