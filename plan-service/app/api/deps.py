"""Dependency injection for API routes."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.storage import StorageService, storage


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session."""
    async for session in get_session():
        yield session


def get_storage() -> StorageService:
    """Return the MinIO storage service singleton."""
    return storage
