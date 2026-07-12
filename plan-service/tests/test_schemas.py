"""Tests for plan schemas."""

import uuid

from app.schemas.plan import PlanUploadResponse
from app.schemas.space import Point, SpaceStatistics


def test_plan_upload_response():
    """PlanUploadResponse should serialize correctly."""
    plan_id = uuid.uuid4()
    response = PlanUploadResponse(
        plan_id=plan_id,
        storage_key=f"plans/{plan_id}/test.dxf",
        original_filename="test.dxf",
        file_type="dxf",
        processing_status="pending",
    )
    assert response.plan_id == plan_id
    assert response.file_type == "dxf"
    assert response.processing_status == "pending"


def test_point_schema():
    """Point should hold x, y coordinates."""
    p = Point(x=1.5, y=2.3)
    assert p.x == 1.5
    assert p.y == 2.3


def test_space_statistics():
    """SpaceStatistics should calculate correctly."""
    stats = SpaceStatistics(
        total_spaces=10,
        total_area_m2=120.5,
        classified_spaces=8,
        unclassified_spaces=2,
        average_confidence=0.85,
    )
    assert stats.total_spaces == 10
    assert stats.average_confidence == 0.85
