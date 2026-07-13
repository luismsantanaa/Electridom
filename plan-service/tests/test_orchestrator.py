"""Tests for the processing orchestrator."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import ezdxf
import pytest

from app.services.processing.orchestrator import ProcessingOrchestrator
from tests.conftest import (
    create_test_pdf_mixed,
    create_test_pdf_raster,
    create_test_pdf_vectorial,
)


def test_process_pdf_vectorial(tmp_path: Path):
    """A vectorial PDF should be routed through the vector parser."""
    filepath = tmp_path / "vectorial.pdf"
    create_test_pdf_vectorial(str(filepath))

    orchestrator = ProcessingOrchestrator()
    with patch.object(
        orchestrator,
        "_measure_and_classify",
        return_value={"spaces": [], "metadata": {"total_spaces": 0}},
    ) as mock_measure:
        result = orchestrator.process_pdf(str(filepath))

    assert result["metadata"]["total_spaces"] == 0
    mock_measure.assert_called_once()


def test_process_pdf_raster(tmp_path: Path):
    """A raster PDF should be routed through the raster parser."""
    filepath = tmp_path / "raster.pdf"
    create_test_pdf_raster(str(filepath))

    orchestrator = ProcessingOrchestrator()
    with patch.object(
        orchestrator,
        "_measure_and_classify",
        return_value={"spaces": [], "metadata": {"total_spaces": 0}},
    ) as mock_measure:
        result = orchestrator.process_pdf(str(filepath))

    assert result["metadata"]["total_spaces"] == 0
    mock_measure.assert_called_once()


def test_process_pdf_mixed(tmp_path: Path):
    """A mixed PDF should be routed through the mixed parser."""
    filepath = tmp_path / "mixed.pdf"
    create_test_pdf_mixed(str(filepath))

    orchestrator = ProcessingOrchestrator()
    with patch.object(
        orchestrator,
        "_measure_and_classify",
        return_value={"spaces": [], "metadata": {"total_spaces": 0}},
    ) as mock_measure:
        result = orchestrator.process_pdf(str(filepath))

    assert result["metadata"]["total_spaces"] == 0
    mock_measure.assert_called_once()


def test_process_dxf(tmp_path: Path):
    """A DXF should be routed through the DXF pipeline."""
    filepath = tmp_path / "floor.dxf"
    doc = ezdxf.new("R2010")
    doc.header["$INSUNITS"] = 6
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (5, 0), (5, 4), (0, 4)], close=True)
    msp.add_text("SALA", dxfattribs={"insert": (2.5, 2), "height": 0.3})
    doc.saveas(str(filepath))

    orchestrator = ProcessingOrchestrator()
    result = orchestrator.process_dxf(str(filepath))

    assert result["file_type"] == "dxf"
    assert "metadata" in result
    assert "spaces" in result
    assert result["metadata"]["total_spaces"] >= 1


def test_unified_output_format():
    """The orchestrator should return the same top-level structure."""
    orchestrator = ProcessingOrchestrator()
    spaces = [
        {
            "name": "Sala",
            "space_type": "sala",
            "area_m2": 10.0,
            "perimeter_m": 12.0,
            "width_m": 5.0,
            "length_m": 2.0,
            "vertices": [],
            "confidence": 0.9,
            "classification_method": "text_match",
        },
    ]
    result = orchestrator._build_result("pdf", spaces, 1.0)

    assert result["file_type"] == "pdf"
    assert result["scale"] == 1.0
    assert "spaces" in result
    assert "metadata" in result
    assert result["metadata"]["total_spaces"] == 1
    assert result["metadata"]["total_area_m2"] == 10.0
    assert result["metadata"]["classified_spaces"] == 1
    assert result["metadata"]["unclassified_spaces"] == 0


def test_process_pdf_nonexistent_file():
    """A missing PDF should raise FileNotFoundError."""
    orchestrator = ProcessingOrchestrator()

    with pytest.raises(FileNotFoundError):
        orchestrator.process_pdf("/nonexistent/path/file.pdf")


def test_process_dxf_nonexistent_file():
    """A missing DXF should raise FileNotFoundError."""
    orchestrator = ProcessingOrchestrator()

    with pytest.raises(FileNotFoundError):
        orchestrator.process_dxf("/nonexistent/path/file.dxf")
