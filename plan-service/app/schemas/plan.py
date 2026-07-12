"""Pydantic schemas for Plan entity."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class PlanUploadResponse(BaseModel):
    """Response after uploading a plan file."""

    plan_id: uuid.UUID
    storage_key: str
    original_filename: str
    file_type: str
    processing_status: str
    message: str = Field(default="Plan uploaded successfully. Processing queued.")


class PlanDetail(BaseModel):
    """Detailed plan information."""

    id: uuid.UUID
    project_id: uuid.UUID | None = None
    file_type: str
    storage_key: str
    original_filename: str
    processing_status: str
    processing_error: str | None = None
    created_at: datetime
    updated_at: datetime
    space_count: int = 0

    model_config = {"from_attributes": True}


class PlanListItem(BaseModel):
    """Summary item for plan listing."""

    id: uuid.UUID
    project_id: uuid.UUID | None = None
    file_type: str
    original_filename: str
    processing_status: str
    space_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class PlanListResponse(BaseModel):
    """Paginated list of plans."""

    items: list[PlanListItem]
    total: int
    page: int
    page_size: int
