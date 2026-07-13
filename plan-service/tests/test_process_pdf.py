"""Tests for the PDF processing Celery task."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pymupdf

from app.models.plan import Plan
from app.tasks.process_pdf import process_pdf_task


def _make_plan(plan_id: uuid.UUID | None = None) -> Plan:
    """Create a Plan instance for PDF task testing."""
    plan_id = plan_id or uuid.uuid4()
    now = datetime.now(UTC)
    return Plan(
        id=plan_id,
        project_id=uuid.uuid4(),
        file_type="pdf",
        storage_key=f"plans/{plan_id}/floor.pdf",
        original_filename="floor.pdf",
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
    session.add_all = MagicMock()
    return session


def _create_test_pdf(tmp_path: Path) -> Path:
    """Create a simple vectorial PDF with one rectangle."""
    filepath = tmp_path / "floor.pdf"
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.draw_rect(pymupdf.Rect(50, 50, 250, 250), color=(0, 0, 0), width=1)
    doc.save(str(filepath))
    doc.close()
    return filepath


@patch("app.tasks.process_pdf.storage")
@patch("app.tasks.process_pdf.async_session_factory")
def test_process_pdf_full_pipeline(mock_session_factory, mock_storage, tmp_path):
    """The full pipeline should process the PDF and persist results."""
    plan = _make_plan()
    session = _mock_session(plan)
    mock_session_factory.return_value = session

    pdf_path = _create_test_pdf(tmp_path)
    mock_storage.download_file.return_value = pdf_path.read_bytes()

    result = process_pdf_task(str(plan.id))

    assert result["status"] == "completed"
    assert plan.processing_status == "completed"
    assert plan.processing_error is None
    assert plan.processing_result is not None
    assert "metadata" in plan.processing_result


@patch("app.tasks.process_pdf.storage")
@patch("app.tasks.process_pdf.async_session_factory")
def test_process_pdf_invalid_file(mock_session_factory, mock_storage, tmp_path):
    """A corrupt PDF should set the plan status to failed."""
    plan = _make_plan()
    session = _mock_session(plan)
    mock_session_factory.return_value = session

    corrupt_path = tmp_path / "corrupt.pdf"
    corrupt_path.write_text("This is not a valid PDF file")
    mock_storage.download_file.return_value = corrupt_path.read_bytes()

    result = process_pdf_task(str(plan.id))

    assert result["status"] == "failed"
    assert plan.processing_status == "failed"
    assert plan.processing_error is not None


@patch("app.tasks.process_pdf.storage")
@patch("app.tasks.process_pdf.async_session_factory")
def test_process_pdf_empty_file(mock_session_factory, mock_storage, tmp_path):
    """An empty PDF should complete with zero spaces detected."""
    plan = _make_plan()
    session = _mock_session(plan)
    mock_session_factory.return_value = session

    empty_path = tmp_path / "empty.pdf"
    doc = pymupdf.open()
    doc.new_page(width=595, height=842)
    doc.save(str(empty_path))
    doc.close()
    mock_storage.download_file.return_value = empty_path.read_bytes()

    result = process_pdf_task(str(plan.id))

    assert result["status"] == "completed"
    assert result["spaces_detected"] == 0
    assert plan.processing_status == "completed"
    assert plan.processing_result["metadata"]["total_spaces"] == 0


@patch("app.tasks.process_pdf.storage")
@patch("app.tasks.process_pdf.async_session_factory")
def test_process_pdf_plan_not_found(mock_session_factory, mock_storage):
    """If the plan is missing, the task should fail fast."""
    session = AsyncMock()
    session.__aenter__ = AsyncMock(return_value=session)
    session.__aexit__ = AsyncMock(return_value=None)
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    session.execute.return_value = result
    mock_session_factory.return_value = session

    plan_id = str(uuid.uuid4())
    result = process_pdf_task(plan_id)

    assert result["status"] == "failed"
    assert result["error"] == "Plan not found"
