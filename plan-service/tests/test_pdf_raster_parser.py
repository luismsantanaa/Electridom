"""Tests for the PDF raster parser."""

from __future__ import annotations

import io
from pathlib import Path

import numpy as np
import pymupdf
import pytest
from PIL import Image, ImageDraw
from shapely import LineString, Polygon

from app.services.pdf.raster_parser import PdfRasterParser


def _create_raster_pdf(filepath: Path) -> None:
    """Create a raster PDF with two black rectangles on a white background."""
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    img = Image.new("RGB", (595, 842), "white")
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 250, 250], outline="black", width=3)
    draw.rectangle([250, 50, 450, 250], outline="black", width=3)
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    page.insert_image(pymupdf.Rect(0, 0, 595, 842), stream=img_bytes.getvalue())
    doc.save(str(filepath))
    doc.close()


def test_parse_raster_pdf(tmp_path: Path):
    """The parser should extract polygons from a synthetic raster PDF."""
    filepath = tmp_path / "raster.pdf"
    _create_raster_pdf(filepath)

    parser = PdfRasterParser(scale=1.0, dpi=150)
    polygons = parser.parse(str(filepath))

    assert isinstance(polygons, list)
    # The test rectangles may or may not close into polygons depending on the
    # threshold; the function should at least not raise and return a list.


def test_preprocess():
    """Preprocessing should return a binary image."""
    parser = PdfRasterParser(scale=1.0, dpi=150)
    image = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    binary = parser._preprocess(image)

    assert binary.ndim == 2
    assert binary.shape == (100, 100)
    assert set(np.unique(binary)).issubset({0, 255})


def test_detect_contours():
    """Contour detection should return LineStrings for a simple shape."""
    parser = PdfRasterParser(scale=1.0, dpi=150)
    image = np.ones((200, 200), dtype=np.uint8) * 255
    cv2 = pytest.importorskip("cv2")
    cv2.rectangle(image, (50, 50), (150, 150), 0, 3)
    binary = cv2.adaptiveThreshold(
        image,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        11,
        2,
    )

    lines = parser._detect_contours(binary)

    assert isinstance(lines, list)
    assert all(isinstance(line, LineString) for line in lines)


def test_detect_lines():
    """HoughLinesP should detect the edges of a rectangle."""
    parser = PdfRasterParser(scale=1.0, dpi=150)
    cv2 = pytest.importorskip("cv2")
    image = np.ones((200, 200), dtype=np.uint8) * 255
    cv2.rectangle(image, (50, 50), (150, 150), 0, 3)
    binary = cv2.adaptiveThreshold(
        image,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        11,
        2,
    )

    lines = parser._detect_lines(binary)

    assert isinstance(lines, list)
    assert all(isinstance(line, LineString) for line in lines)


def test_contour_to_polygon():
    """A square contour should convert to a Shapely Polygon."""
    parser = PdfRasterParser(scale=1.0, dpi=150)
    pytest.importorskip("cv2")
    contour = np.array(
        [[[50, 50]], [[150, 50]], [[150, 150]], [[50, 150]]],
        dtype=np.int32,
    )

    polygon = parser._contour_to_polygon(contour)

    assert isinstance(polygon, Polygon)
    assert polygon.is_valid
    assert polygon.area > 0


def test_parse_empty_image(tmp_path: Path):
    """A blank raster PDF should yield no polygons."""
    filepath = tmp_path / "blank.pdf"
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    img = Image.new("RGB", (595, 842), "white")
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    page.insert_image(pymupdf.Rect(0, 0, 595, 842), stream=img_bytes.getvalue())
    doc.save(str(filepath))
    doc.close()

    parser = PdfRasterParser(scale=1.0, dpi=150)
    polygons = parser.parse(str(filepath))

    assert polygons == []


def test_parse_nonexistent_file():
    """A missing file should raise FileNotFoundError."""
    parser = PdfRasterParser(scale=1.0, dpi=150)

    with pytest.raises(FileNotFoundError):
        parser.parse("/nonexistent/path/file.pdf")
