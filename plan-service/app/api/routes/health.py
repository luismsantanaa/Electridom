"""Health check endpoint — verifies connectivity to all dependencies."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_storage
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

    status = "ok" if all(v == "ok" for v in checks.values()) else "degraded"

    return {"status": status, "checks": checks}
