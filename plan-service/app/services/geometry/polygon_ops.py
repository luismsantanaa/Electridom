"""Polygon operations — Shapely-based geometric computations."""

from __future__ import annotations

import logging

from shapely import MultiPolygon, Polygon, unary_union
from shapely.validation import explain_validity

logger = logging.getLogger(__name__)


class PolygonOperations:
    """Geometric operations on polygons using Shapely."""

    @staticmethod
    def calculate_area(polygon: Polygon, scale: float = 1.0) -> float:
        """Calculate area of a polygon in square meters."""
        return float(polygon.area) * (scale**2)

    @staticmethod
    def calculate_perimeter(polygon: Polygon, scale: float = 1.0) -> float:
        """Calculate perimeter of a polygon in meters."""
        return float(polygon.length) * scale

    @staticmethod
    def is_valid(polygon: Polygon) -> bool:
        """Check if a polygon is geometrically valid."""
        valid = bool(polygon.is_valid)
        if not valid:
            reason = explain_validity(polygon)
            logger.debug("Invalid polygon: %s", reason)
        return valid

    @staticmethod
    def merge_polygons(polygons: list[Polygon]) -> list[Polygon]:
        """Merge overlapping polygons into a list of non-overlapping polygons."""
        if not polygons:
            return []

        merged = unary_union(polygons)
        if isinstance(merged, Polygon):
            return [merged]
        if isinstance(merged, MultiPolygon):
            return list(merged.geoms)
        return []
