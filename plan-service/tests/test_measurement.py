"""Tests for space measurement."""

from __future__ import annotations

from shapely import Polygon

from app.services.geometry.measurement import SpaceMeasurement


def test_calculate_area_square():
    """A 10x10 polygon at scale 1.0 should have area 100 m²."""
    polygon = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])
    measurement = SpaceMeasurement()

    dims = measurement.calculate(polygon, scale=1.0)

    assert abs(dims.area_m2 - 100.0) < 1e-9


def test_calculate_area_with_scale():
    """A 10x10 polygon at scale 0.1 should have area 1.0 m²."""
    polygon = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])
    measurement = SpaceMeasurement()

    dims = measurement.calculate(polygon, scale=0.1)

    assert abs(dims.area_m2 - 1.0) < 1e-9


def test_calculate_perimeter():
    """A 10x10 polygon should have perimeter 40 m."""
    polygon = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])
    measurement = SpaceMeasurement()

    dims = measurement.calculate(polygon, scale=1.0)

    assert abs(dims.perimeter_m - 40.0) < 1e-9


def test_bounding_box():
    """Bounding-box width and length should be scaled correctly."""
    polygon = Polygon([(0, 0), (8, 0), (8, 5), (0, 5)])
    measurement = SpaceMeasurement()

    dims = measurement.calculate(polygon, scale=1.0)

    assert abs(dims.width_m - 8.0) < 1e-9
    assert abs(dims.length_m - 5.0) < 1e-9


def test_vertices_extraction():
    """Vertices should list exterior coordinates without the closing duplicate."""
    polygon = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])
    measurement = SpaceMeasurement()

    dims = measurement.calculate(polygon, scale=1.0)

    assert len(dims.vertices) == 4
    assert (0.0, 0.0) in dims.vertices
    assert (10.0, 10.0) in dims.vertices
