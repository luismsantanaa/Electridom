"""Test configuration and fixtures."""

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import ezdxf
import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_db, get_storage
from app.core.storage import StorageService
from app.main import create_app
from app.models.detected_space import DetectedSpace
from app.models.plan import Plan


@pytest.fixture
def app():
    """Create a fresh FastAPI application instance."""
    return create_app()


@pytest.fixture
def client(app):
    """Create a TestClient for the application."""
    return TestClient(app)


@pytest.fixture
def mock_db():
    """Return a mocked async database session."""
    session = AsyncMock()
    # db.add is called synchronously; db.delete is awaited in routes.
    session.add = MagicMock(return_value=None)
    session.delete = AsyncMock(return_value=None)
    return session


@pytest.fixture
def mock_storage():
    """Return a mocked storage service."""
    return MagicMock(spec=StorageService)


@pytest.fixture
def override_deps(app, mock_db, mock_storage):
    """Override FastAPI dependencies with mocked implementations."""

    async def _get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    def _get_storage() -> MagicMock:
        return mock_storage

    app.dependency_overrides[get_db] = _get_db
    app.dependency_overrides[get_storage] = _get_storage
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def patch_process_tasks():
    """Patch Celery processing tasks in the plans and processing modules."""
    with (
        patch("app.api.routes.plans.process_dxf_task") as mock_dxf,
        patch("app.api.routes.plans.process_pdf_task") as mock_pdf,
        patch("app.api.routes.processing.process_dxf_task") as mock_dxf_proc,
        patch("app.api.routes.processing.process_pdf_task") as mock_pdf_proc,
    ):
        task = MagicMock()
        task.id = "celery-task-id"
        mock_dxf.delay.return_value = task
        mock_pdf.delay.return_value = task
        mock_dxf_proc.delay.return_value = task
        mock_pdf_proc.delay.return_value = task
        yield {
            "dxf": mock_dxf,
            "pdf": mock_pdf,
            "dxf_proc": mock_dxf_proc,
            "pdf_proc": mock_pdf_proc,
        }


def make_plan(
    plan_id: uuid.UUID | None = None,
    file_type: str = "dxf",
    status: str = "pending",
    original_filename: str | None = None,
    detected_spaces: list[DetectedSpace] | None = None,
) -> Plan:
    """Create a Plan instance for testing."""
    plan_id = plan_id or uuid.uuid4()
    filename = original_filename or f"test.{file_type}"
    now = datetime.now(UTC)
    return Plan(
        id=plan_id,
        project_id=uuid.uuid4(),
        file_type=file_type,
        storage_key=f"plans/{plan_id}/{filename}",
        original_filename=filename,
        processing_status=status,
        processing_result=None,
        processing_error=None,
        created_at=now,
        updated_at=now,
        detected_spaces=detected_spaces or [],
    )


def make_space(
    space_id: uuid.UUID | None = None,
    plan_id: uuid.UUID | None = None,
    name: str = "Room",
    space_type: str = "room",
    area_m2: float = 10.0,
    perimeter_m: float = 12.0,
    confidence: float = 0.9,
    is_verified: bool = False,
) -> DetectedSpace:
    """Create a DetectedSpace instance for testing."""
    return DetectedSpace(
        id=space_id or uuid.uuid4(),
        plan_id=plan_id or uuid.uuid4(),
        name=name,
        space_type=space_type,
        area_m2=area_m2,
        perimeter_m=perimeter_m,
        vertices=[{"x": 0.0, "y": 0.0}, {"x": 5.0, "y": 0.0}],
        confidence=confidence,
        classification_method="rule_based",
        is_verified=is_verified,
        created_at=datetime.now(UTC),
    )


def scalar_result(value):
    """Build a mocked query result that supports scalar_one_or_none()."""
    result = MagicMock()
    result.scalar_one_or_none.return_value = value
    return result


def count_result(total: int):
    """Build a mocked query result for count queries."""
    result = MagicMock()
    result.scalar.return_value = total
    return result


def fetch_result(items: list):
    """Build a mocked query result for fetch queries."""
    result = MagicMock()
    result.scalars.return_value.all.return_value = items
    return result


def create_test_dxf_with_rooms(filepath: str) -> None:
    """Create a test DXF with three rooms: sala, cocina, bano."""
    doc = ezdxf.new("R2010")
    doc.header["$INSUNITS"] = 6  # meters
    msp = doc.modelspace()

    # Room 1: Sala (closed polyline, 5x4 meters)
    msp.add_lwpolyline([(0, 0), (5, 0), (5, 4), (0, 4)], close=True)
    msp.add_text("SALA", dxfattribs={"insert": (2.5, 2), "height": 0.3})

    # Room 2: Cocina (lines forming a rectangle, 3x3 meters)
    msp.add_line((5, 0), (8, 0))
    msp.add_line((8, 0), (8, 3))
    msp.add_line((8, 3), (5, 3))
    msp.add_line((5, 3), (5, 0))
    msp.add_text("COCINA", dxfattribs={"insert": (6.5, 1.5), "height": 0.3})

    # Room 3: Bano (small closed polyline, 2x2 meters)
    msp.add_lwpolyline([(0, 4), (2, 4), (2, 6), (0, 6)], close=True)
    msp.add_text("BAÑO", dxfattribs={"insert": (1, 5), "height": 0.3})

    doc.saveas(filepath)


def create_empty_test_dxf(filepath: str) -> None:
    """Create an empty DXF file (no entities)."""
    doc = ezdxf.new("R2010")
    doc.header["$INSUNITS"] = 6
    doc.saveas(filepath)


def create_test_dxf_with_units(filepath: str, units_code: int) -> None:
    """Create a simple square DXF with the requested $INSUNITS code."""
    doc = ezdxf.new("R2010")
    doc.header["$INSUNITS"] = units_code
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (10, 0), (10, 10), (0, 10)], close=True)
    doc.saveas(filepath)


def create_test_pdf_vectorial(filepath: str) -> None:
    """Create a PDF with vectorial content (lines, rectangles)."""
    import pymupdf

    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.draw_rect(pymupdf.Rect(50, 50, 250, 250), color=(0, 0, 0), width=1)
    page.draw_rect(pymupdf.Rect(250, 50, 450, 250), color=(0, 0, 0), width=1)
    page.draw_line(pymupdf.Point(50, 250), pymupdf.Point(450, 250), color=(0, 0, 0), width=1)
    doc.save(filepath)
    doc.close()


def create_test_pdf_raster(filepath: str) -> None:
    """Create a PDF with a raster image (scanned plan simulation)."""
    import io

    import pymupdf
    from PIL import Image, ImageDraw

    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    img = Image.new("RGB", (595, 842), "white")
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 250, 250], outline="black", width=2)
    draw.rectangle([250, 50, 450, 250], outline="black", width=2)
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    page.insert_image(pymupdf.Rect(0, 0, 595, 842), stream=img_bytes.getvalue())
    doc.save(filepath)
    doc.close()


def create_test_pdf_mixed(filepath: str) -> None:
    """Create a PDF with both vectorial and raster content."""
    import io

    import pymupdf
    from PIL import Image, ImageDraw

    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.draw_rect(pymupdf.Rect(50, 300, 250, 500), color=(0, 0, 0), width=1)
    img = Image.new("RGB", (200, 200), "white")
    draw = ImageDraw.Draw(img)
    draw.rectangle([10, 10, 190, 190], outline="black", width=2)
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    page.insert_image(pymupdf.Rect(300, 50, 500, 250), stream=img_bytes.getvalue())
    doc.save(filepath)
    doc.close()
