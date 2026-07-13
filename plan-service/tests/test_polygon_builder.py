"""Tests for the polygon builder."""

from __future__ import annotations

import ezdxf
import pytest

from app.services.dxf.parser import DxfParser
from app.services.dxf.polygon_builder import PolygonBuilder


@pytest.fixture
def builder():
    """Return a fresh PolygonBuilder instance."""
    return PolygonBuilder()


def test_build_from_closed_lwpolyline(builder, tmp_path):
    """A closed LWPOLYLINE should produce one polygon."""
    filepath = tmp_path / "closed.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (10, 0), (10, 10), (0, 10)], close=True)
    doc.saveas(str(filepath))

    entities = DxfParser().parse(str(filepath))
    polygons = builder.build_polygons(entities, scale=1.0)

    assert len(polygons) == 1
    assert abs(polygons[0].area - 100.0) < 0.01


def test_build_from_line_segments(builder, tmp_path):
    """Four LINEs forming a square should polygonize to one polygon."""
    filepath = tmp_path / "lines.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_line((0, 0), (10, 0))
    msp.add_line((10, 0), (10, 10))
    msp.add_line((10, 10), (0, 10))
    msp.add_line((0, 10), (0, 0))
    doc.saveas(str(filepath))

    entities = DxfParser().parse(str(filepath))
    polygons = builder.build_polygons(entities, scale=1.0)

    assert len(polygons) == 1
    assert abs(polygons[0].area - 100.0) < 0.01


def test_build_multiple_rooms(builder, tmp_path):
    """Two separate squares should yield two polygons."""
    filepath = tmp_path / "rooms.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    # Room 1
    msp.add_lwpolyline([(0, 0), (5, 0), (5, 5), (0, 5)], close=True)
    # Room 2
    msp.add_lwpolyline([(10, 0), (15, 0), (15, 5), (10, 5)], close=True)
    doc.saveas(str(filepath))

    entities = DxfParser().parse(str(filepath))
    polygons = builder.build_polygons(entities, scale=1.0)

    assert len(polygons) == 2


def test_filter_small_polygons(builder, tmp_path):
    """Polygons smaller than 0.5 m² should be filtered out."""
    filepath = tmp_path / "small.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (0.5, 0), (0.5, 0.5), (0, 0.5)], close=True)
    doc.saveas(str(filepath))

    entities = DxfParser().parse(str(filepath))
    polygons = builder.build_polygons(entities, scale=1.0)

    assert len(polygons) == 0


def test_remove_duplicate_polygons(builder, tmp_path):
    """Polygons with the same vertices in a different order should be deduplicated."""
    filepath = tmp_path / "duplicates.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (10, 0), (10, 10), (0, 10)], close=True)
    msp.add_lwpolyline([(10, 0), (10, 10), (0, 10), (0, 0)], close=True)
    doc.saveas(str(filepath))

    entities = DxfParser().parse(str(filepath))
    polygons = builder.build_polygons(entities, scale=1.0)

    assert len(polygons) == 1


def test_mixed_input(builder, tmp_path):
    """Closed polylines plus line segments should all yield polygons."""
    filepath = tmp_path / "mixed.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (5, 0), (5, 5), (0, 5)], close=True)
    msp.add_line((10, 0), (15, 0))
    msp.add_line((15, 0), (15, 5))
    msp.add_line((15, 5), (10, 5))
    msp.add_line((10, 5), (10, 0))
    doc.saveas(str(filepath))

    entities = DxfParser().parse(str(filepath))
    polygons = builder.build_polygons(entities, scale=1.0)

    assert len(polygons) == 2


def test_arc_tessellation(builder, tmp_path):
    """An ARC should be tessellated into line segments that can help form a polygon."""
    filepath = tmp_path / "arc.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    # Semicircle plus a diameter line forms a closed region.
    msp.add_arc((0, 0), radius=5, start_angle=0, end_angle=180)
    msp.add_line((-5, 0), (5, 0))
    doc.saveas(str(filepath))

    entities = DxfParser().parse(str(filepath))
    polygons = builder.build_polygons(entities, scale=1.0)

    assert len(polygons) >= 1
    assert polygons[0].area > 0.5


def test_snapping_tolerance(builder, tmp_path):
    """Endpoints within 2 mm should be snapped and form a closed polygon."""
    filepath = tmp_path / "snap.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    # Leave a tiny 1 mm gap at the closing corner.
    msp.add_line((0, 0), (10, 0))
    msp.add_line((10, 0), (10, 10))
    msp.add_line((10, 10), (0, 10))
    msp.add_line((0, 10), (0.001, 0))  # gap of 1 mm
    doc.saveas(str(filepath))

    entities = DxfParser().parse(str(filepath))
    polygons = builder.build_polygons(entities, scale=1.0)

    assert len(polygons) == 1
    assert abs(polygons[0].area - 100.0) < 1.0
