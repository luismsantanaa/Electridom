"""Pydantic schemas for DetectedSpace entity."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class Point(BaseModel):
    """2D coordinate point."""

    x: float
    y: float


class DetectedSpaceResponse(BaseModel):
    """Detected space information."""

    id: uuid.UUID
    plan_id: uuid.UUID
    name: str | None = None
    space_type: str | None = None
    area_m2: float | None = None
    perimeter_m: float | None = None
    vertices: list[Point]
    confidence: float | None = None
    classification_method: str | None = None
    is_verified: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class SpaceUpdateRequest(BaseModel):
    """Request to update/verify a detected space."""

    name: str | None = None
    space_type: str | None = None
    vertices: list[Point] | None = None
    is_verified: bool | None = None


class SpaceStatistics(BaseModel):
    """Statistics about detected spaces in a plan."""

    total_spaces: int
    total_area_m2: float
    classified_spaces: int
    unclassified_spaces: int
    average_confidence: float


class ProcessingResult(BaseModel):
    """Full processing result for a plan."""

    plan_id: uuid.UUID
    file_type: str
    processing_status: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    spaces: list[DetectedSpaceResponse] = Field(default_factory=list)
    statistics: SpaceStatistics | None = None
