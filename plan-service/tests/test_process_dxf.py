"""Tests for the DXF processing Celery task."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import ezdxf

from app.models.detected_space import DetectedSpace
from app.models.plan import Plan
from app.tasks.process_dxf import process_dxf_task


def _make_plan(plan_id: uuid.UUID | None = None) -> Plan:
    """Create a Plan instance for task testing."""
    plan_id = plan_id or uuid.uuid4()
    now = datetime.now(UTC)
    return Plan(
        id=plan_id,
        project_id=uuid.uuid4(),
        file_type="dxf",
        storage_key=f"plans/{plan_id}/floor.dxf",
        original_filename="floor.dxf",
        processing_status="pending",
        processing_result=None,
        processing_error=None,
        created_at=now,
        updated_at=now,
        detected_spaces=[],
    )


def _mock_session(plan: Plan):
    """Build a mocked async session that returns the given plan."""
    session = AsyncMock()
    session.__aenter__ = AsyncMock(return_value=session)
    session.__aexit__ = AsyncMock(return_value=None)

    result = MagicMock()
    result.scalar_one_or_none.return_value = plan
    session.execute.return_value = result
    # add_all is a synchronous method on AsyncSession.
    session.add_all = MagicMock()
    return session


def _create_test_dxf(tmp_path: Path) -> Path:
    """Create a simple DXF file with two labeled rooms."""
    filepath = tmp_path / "floor.dxf"
    doc = ezdxf.new("R2010")
    doc.header["$INSUNITS"] = 6
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (5, 0), (5, 4), (0, 4)], close=True)
    msp.add_text("SALA", dxfattribs={"insert": (2.5, 2), "height": 0.3})
    msp.add_lwpolyline([(5, 0), (8, 0), (8, 3), (5, 3)], close=True)
    msp.add_text("COCINA", dxfattribs={"insert": (6.5, 1.5), "height": 0.3})
    doc.saveas(str(filepath))
    return filepath


@patch("app.tasks.process_dxf.storage")
@patch("app.tasks.process_dxf.async_session_factory")
def test_process_dxf_full_pipeline(mock_session_factory, mock_storage, tmp_path):
    """The full pipeline should parse the DXF and persist detected spaces."""
    plan = _make_plan()
    session = _mock_session(plan)
    mock_session_factory.return_value = session

    dxf_path = _create_test_dxf(tmp_path)
    mock_storage.download_file.return_value = dxf_path.read_bytes()

    result = process_dxf_task(str(plan.id))

    assert result["status"] == "completed"
    assert result["spaces_detected"] == 2
    assert plan.processing_status == "completed"
    assert plan.processing_error is None

    # Verify DetectedSpace records were added.
    assert session.add_all.called
    spaces = session.add_all.call_args.args[0]
    assert all(isinstance(space, DetectedSpace) for space in spaces)
    assert len(spaces) == 2
    assert plan.processing_result is not None
    assert "metadata" in plan.processing_result
    assert "statistics" in plan.processing_result


@patch("app.tasks.process_dxf.storage")
@patch("app.tasks.process_dxf.async_session_factory")
def test_process_dxf_invalid_file(mock_session_factory, mock_storage, tmp_path):
    """A corrupt DXF should set the plan status to failed."""
    plan = _make_plan()
    session = _mock_session(plan)
    mock_session_factory.return_value = session

    corrupt_path = tmp_path / "corrupt.dxf"
    corrupt_path.write_text("This is not a valid DXF file")
    mock_storage.download_file.return_value = corrupt_path.read_bytes()

    result = process_dxf_task(str(plan.id))

    assert result["status"] == "failed"
    assert plan.processing_status == "failed"
    assert plan.processing_error is not None


@patch("app.tasks.process_dxf.storage")
@patch("app.tasks.process_dxf.async_session_factory")
def test_process_dxf_empty_file(mock_session_factory, mock_storage, tmp_path):
    """An empty DXF should complete with zero spaces detected."""
    plan = _make_plan()
    session = _mock_session(plan)
    mock_session_factory.return_value = session

    empty_path = tmp_path / "empty.dxf"
    doc = ezdxf.new("R2010")
    doc.header["$INSUNITS"] = 6
    doc.saveas(str(empty_path))
    mock_storage.download_file.return_value = empty_path.read_bytes()

    result = process_dxf_task(str(plan.id))

    assert result["status"] == "completed"
    assert result["spaces_detected"] == 0
    assert plan.processing_status == "completed"
    assert plan.processing_result["statistics"]["total_spaces"] == 0
