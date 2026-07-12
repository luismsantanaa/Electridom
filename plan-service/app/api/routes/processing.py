"""Processing endpoints — trigger and monitor plan processing."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/plans", tags=["processing"])


# TODO (Fase 3): Add processing-specific endpoints
# - POST /api/plans/{id}/process — manually trigger reprocessing
# - GET /api/plans/{id}/progress — detailed progress (percentage, current step)
