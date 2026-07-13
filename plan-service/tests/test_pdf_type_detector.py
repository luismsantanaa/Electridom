"""Tests for the PDF type detector."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.services.pdf.type_detector import PdfType, PdfTypeDetector
from tests.conftest import (
    create_test_pdf_mixed,
    create_test_pdf_raster,
    create_test_pdf_vectorial,
)


def test_detect_vectorial_pdf(tmp_path: Path):
    """A PDF with only drawings should be classified as vectorial."""
    filepath = tmp_path / "vectorial.pdf"
    create_test_pdf_vectorial(str(filepath))

    detector = PdfTypeDetector()
    result = detector.detect(str(filepath))

    assert result == PdfType.VECTORIAL


def test_detect_raster_pdf(tmp_path: Path):
    """A PDF with only images should be classified as raster."""
    filepath = tmp_path / "raster.pdf"
    create_test_pdf_raster(str(filepath))

    detector = PdfTypeDetector()
    result = detector.detect(str(filepath))

    assert result == PdfType.RASTER


def test_detect_mixed_pdf(tmp_path: Path):
    """A PDF with both drawings and images should be classified as mixed."""
    filepath = tmp_path / "mixed.pdf"
    create_test_pdf_mixed(str(filepath))

    detector = PdfTypeDetector()
    result = detector.detect(str(filepath))

    assert result == PdfType.MIXED


def test_detect_empty_pdf(tmp_path: Path):
    """An empty PDF defaults to vectorial."""
    import pymupdf

    filepath = tmp_path / "empty.pdf"
    doc = pymupdf.open()
    doc.new_page(width=595, height=842)
    doc.save(str(filepath))
    doc.close()

    detector = PdfTypeDetector()
    result = detector.detect(str(filepath))

    assert result == PdfType.VECTORIAL


def test_detect_nonexistent_file():
    """A missing file should raise FileNotFoundError."""
    detector = PdfTypeDetector()

    with pytest.raises(FileNotFoundError):
        detector.detect("/nonexistent/path/file.pdf")
