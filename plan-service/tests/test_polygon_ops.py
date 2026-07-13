"""Tests for polygon operations."""

from __future__ import annotations

from shapely import Polygon

from app.services.geometry.polygon_ops import PolygonOperations


def test_calculate_area():
    """calculate_area should honor the scale factor."""
    polygon = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])

    assert abs(PolygonOperations.calculate_area(polygon, scale=1.0) - 100.0) < 1e-9
    assert abs(PolygonOperations.calculate_area(polygon, scale=0.1) - 1.0) < 1e-9


def test_calculate_perimeter():
    """calculate_perimeter should honor the scale factor."""
    polygon = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])

    assert abs(PolygonOperations.calculate_perimeter(polygon, scale=1.0) - 40.0) < 1e-9
    assert abs(PolygonOperations.calculate_perimeter(polygon, scale=0.5) - 20.0) < 1e-9


def test_is_valid_true():
    """A simple square should be valid."""
    polygon = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])

    assert PolygonOperations.is_valid(polygon) is True


def test_is_valid_false():
    """A self-intersecting polygon should be invalid."""
    polygon = Polygon([(0, 0), (10, 10), (10, 0), (0, 10)])

    assert PolygonOperations.is_valid(polygon) is False


def test_merge_overlapping_polygons():
    """Two overlapping polygons should merge into one."""
    poly1 = Polygon([(0, 0), (5, 0), (5, 5), (0, 5)])
    poly2 = Polygon([(3, 3), (8, 3), (8, 8), (3, 8)])

    merged = PolygonOperations.merge_polygons([poly1, poly2])

    assert len(merged) == 1


def test_merge_non_overlapping():
    """Two separate polygons should remain separate."""
    poly1 = Polygon([(0, 0), (5, 0), (5, 5), (0, 5)])
    poly2 = Polygon([(10, 0), (15, 0), (15, 5), (10, 5)])

    merged = PolygonOperations.merge_polygons([poly1, poly2])

    assert len(merged) == 2
