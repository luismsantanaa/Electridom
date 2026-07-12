"""FastAPI application factory and entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.storage import storage


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup: ensure MinIO bucket exists
    try:
        storage.ensure_bucket()
    except Exception:
        pass  # MinIO might not be available in test environments
    yield
    # Shutdown: cleanup if needed


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Plan Service — Calculadora Eléctrica RD",
        description=(
            "Microservice for architectural plan recognition (PDF/DXF). "
            "Extracts spaces, calculates areas, and classifies rooms."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # TODO: restrict in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routes
    from app.api.routes.health import router as health_router
    from app.api.routes.plans import router as plans_router
    from app.api.routes.processing import router as processing_router

    app.include_router(health_router)
    app.include_router(plans_router)
    app.include_router(processing_router)

    return app


app = create_app()
