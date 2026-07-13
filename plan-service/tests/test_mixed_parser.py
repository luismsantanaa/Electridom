"""Tests for the PDF mixed parser."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

from shapely import Polygon

from app.services.pdf.mixed_parser import PdfMixedParser
from app.services.pdf.raster_parser import PdfRasterParser
from app.services.pdf.vector_parser import PdfVectorParser


def test_parse_mixed_pdf(tmp_path: Path):
    """The mixed parser should combine vectorial and raster polygons."""
    filepath = tmp_path / "mixed.pdf"

    import pymupdf

    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.draw_rect(pymupdf.Rect(50, 300, 250, 500), color=(0, 0, 0), width=1)
    doc.save(str(filepath))
    doc.close()

    vector_parser = PdfVectorParser(scale=1.0)
    raster_parser = PdfRasterParser(scale=1.0, dpi=150)
    mixed_parser = PdfMixedParser(vector_parser, raster_parser)

    polygons = mixed_parser.parse(str(filepath))

    assert isinstance(polygons, list)
    assert all(isinstance(poly, Polygon) for poly in polygons)


def test_remove_overlapping():
    """Raster polygons overlapping vectorial ones should be removed."""
    vector_parser = MagicMock(spec=PdfVectorParser)
    raster_parser = MagicMock(spec=PdfRasterParser)

    vector_poly = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])
    raster_poly = Polygon([(1, 1), (9, 1), (9, 9), (1, 9)])

    vector_parser.parse.return_value = [vector_poly]
    raster_parser.parse.return_value = [raster_poly]

    mixed_parser = PdfMixedParser(vector_parser, raster_parser)
    result = mixed_parser.parse("dummy.pdf")

    assert result == [vector_poly]


def test_no_overlap():
    """Non-overlapping raster and vector polygons should both be kept."""
    vector_parser = MagicMock(spec=PdfVectorParser)
    raster_parser = MagicMock(spec=PdfRasterParser)

    vector_poly = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])
    raster_poly = Polygon([(100, 100), (110, 100), (110, 110), (100, 110)])

    vector_parser.parse.return_value = [vector_poly]
    raster_parser.parse.return_value = [raster_poly]

    mixed_parser = PdfMixedParser(vector_parser, raster_parser)
    result = mixed_parser.parse("dummy.pdf")

    assert vector_poly in result
    assert raster_poly in result
    assert len(result) == 2


def test_empty_vector_results():
    """When vector extraction is empty, raster results are returned."""
    vector_parser = MagicMock(spec=PdfVectorParser)
    raster_parser = MagicMock(spec=PdfRasterParser)

    raster_poly = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])
    vector_parser.parse.return_value = []
    raster_parser.parse.return_value = [raster_poly]

    mixed_parser = PdfMixedParser(vector_parser, raster_parser)
    result = mixed_parser.parse("dummy.pdf")

    assert result == [raster_poly]


def test_empty_raster_results():
    """When raster extraction is empty, vector results are returned."""
    vector_parser = MagicMock(spec=PdfVectorParser)
    raster_parser = MagicMock(spec=PdfRasterParser)

    vector_poly = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])
    vector_parser.parse.return_value = [vector_poly]
    raster_parser.parse.return_value = []

    mixed_parser = PdfMixedParser(vector_parser, raster_parser)
    result = mixed_parser.parse("dummy.pdf")

    assert result == [vector_poly]
