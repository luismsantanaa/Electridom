"""SQLAlchemy async database engine and session factory."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Celery tasks run each job inside a fresh asyncio.run() event loop. Pooled
# asyncpg connections are bound to the loop that created them, so reusing the
# API engine's pool across tasks crashes with "Event loop is closed" /
# "'NoneType' object has no attribute 'send'". NullPool opens and closes a
# connection per checkout, keeping every connection on the current loop.
task_engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    poolclass=NullPool,
)

task_session_factory = async_sessionmaker(
    task_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):  # type: ignore[misc]
    """Base class for all SQLAlchemy models."""

    pass


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency: yields an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
