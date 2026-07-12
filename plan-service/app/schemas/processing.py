"""Pydantic schemas for processing status."""

import uuid

from pydantic import BaseModel


class ProcessingStatusResponse(BaseModel):
    """Current processing status of a plan."""

    plan_id: uuid.UUID
    processing_status: str  # pending, processing, completed, failed
    celery_task_id: str | None = None
    progress_percent: int | None = None
    error_message: str | None = None
    spaces_detected: int | None = None
