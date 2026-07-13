"""Tests for the PDF vector parser."""

from __future__ import annotations

from pathlib import Path

import pymupdf
import pytest
from shapely import LineString, Point

from app.services.pdf.vector_parser import PdfVectorParser


def _create_vectorial_pdf(filepath: Path) -> None:
    """Create a vectorial PDF with two separate closed rectangles."""
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.draw_rect(pymupdf.Rect(50, 50, 250, 250), color=(0, 0, 0), width=1)
    page.draw_rect(pymupdf.Rect(300, 50, 500, 250), color=(0, 0, 0), width=1)
    page.insert_text(pymupdf.Point(120, 150), "SALA", fontsize=12)
    doc.save(str(filepath))
    doc.close()


def test_parse_vectorial_pdf(tmp_path: Path):
    """The parser should extract polygons from a synthetic vectorial PDF."""
    filepath = tmp_path / "vectorial.pdf"
    _create_vectorial_pdf(filepath)

    # Use a scale that makes the 200-point rectangles large enough to pass
    # the 0.5 m2 area filter used by PolygonBuilder.
    parser = PdfVectorParser(scale=100.0)
    polygons = parser.parse(str(filepath))

    assert isinstance(polygons, list)
    assert len(polygons) >= 1
    assert all(poly.is_valid for poly in polygons)


def test_extract_lines(tmp_path: Path):
    """Line items should be converted to LineStrings."""
    filepath = tmp_path / "line.pdf"
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.draw_line(pymupdf.Point(10, 10), pymupdf.Point(100, 100), color=(0, 0, 0), width=1)
    doc.save(str(filepath))
    doc.close()

    parser = PdfVectorParser(scale=1.0)
    lines, texts = parser._extract_drawings(pymupdf.open(str(filepath))[0])
    pymupdf.open(str(filepath)).close()

    assert len(lines) >= 1
    line_strings = [LineString([line.start, line.end]) for line in lines]
    assert all(isinstance(line, LineString) for line in line_strings)


def test_extract_rectangles(tmp_path: Path):
    """A rectangle should be converted to four line segments."""
    filepath = tmp_path / "rect.pdf"
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.draw_rect(pymupdf.Rect(50, 50, 150, 150), color=(0, 0, 0), width=1)
    doc.save(str(filepath))
    doc.close()

    parser = PdfVectorParser(scale=1.0)
    lines, _ = parser._extract_drawings(pymupdf.open(str(filepath))[0])
    pymupdf.open(str(filepath)).close()

    assert len(lines) >= 4


def test_bezier_to_lines():
    """A cubic Bezier should be tessellated into line segments."""
    parser = PdfVectorParser(scale=1.0)
    p1 = Point(0, 0)
    p2 = Point(0, 100)
    p3 = Point(100, 100)
    p4 = Point(100, 0)

    segments = parser._bezier_to_lines(p1, p2, p3, p4)

    assert len(segments) >= 1
    assert all(isinstance(seg, LineString) for seg in segments)


def test_parse_empty_pdf(tmp_path: Path):
    """An empty PDF should yield no polygons."""
    filepath = tmp_path / "empty.pdf"
    doc = pymupdf.open()
    doc.new_page(width=595, height=842)
    doc.save(str(filepath))
    doc.close()

    parser = PdfVectorParser(scale=1.0)
    polygons = parser.parse(str(filepath))

    assert polygons == []


def test_filter_short_lines(tmp_path: Path):
    """Segments shorter than one point should be filtered out."""
    filepath = tmp_path / "short_lines.pdf"
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.draw_line(pymupdf.Point(10, 10), pymupdf.Point(10.5, 10), color=(0, 0, 0), width=1)
    doc.save(str(filepath))
    doc.close()

    parser = PdfVectorParser(scale=1.0)
    lines, _ = parser._extract_drawings(pymupdf.open(str(filepath))[0])
    pymupdf.open(str(filepath)).close()

    assert all(LineString([line.start, line.end]).length >= 1.0 for line in lines)


def test_parse_nonexistent_file():
    """A missing file should raise FileNotFoundError."""
    parser = PdfVectorParser(scale=1.0)

    with pytest.raises(FileNotFoundError):
        parser.parse("/nonexistent/path/file.pdf")
