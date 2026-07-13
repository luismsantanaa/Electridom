"""Polygon builder — reconstructs closed polygons from line segments."""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass

from shapely import LineString, Polygon
from shapely.ops import polygonize

from app.services.dxf.parser import (
    ArcEntity,
    DxfEntities,
    PolylineEntity,
)

logger = logging.getLogger(__name__)

# Real-world snap tolerance: 2 millimeters.
SNAP_TOLERANCE = 0.002
# Minimum closed polygon area in square meters.
MIN_AREA_M2 = 0.5
# Arc tessellation step in degrees.
ARC_STEP_DEGREES = 5.0


@dataclass
class PolygonBuildStats:
    """Statistics collected while building polygons."""

    from_closed_polylines: int
    from_polygonize: int
    filtered_count: int


def _snap_coordinate(value: float, tolerance: float) -> float:
    """Round a coordinate to the nearest grid multiple of tolerance."""
    return round(value / tolerance) * tolerance


def _snap_point(point: tuple[float, float], tolerance: float) -> tuple[float, float]:
    """Snap a 2D point to a tolerance grid."""
    return (_snap_coordinate(point[0], tolerance), _snap_coordinate(point[1], tolerance))


def _round_linestring(line: LineString, tolerance: float) -> LineString:
    """Snap both endpoints of a LineString to the tolerance grid."""
    coords = list(line.coords)
    if not coords:
        return line
    snapped = [_snap_point((x, y), tolerance) for x, y in coords]
    # Collapse very short segments to a single point to avoid zero-length lines.
    if len(snapped) == 2 and snapped[0] == snapped[1]:
        return LineString([snapped[0]])
    return LineString(snapped)


def _polyline_to_segments(poly: PolylineEntity, scale: float) -> list[LineString]:
    """Convert an open polyline into a list of LineString segments."""
    segments: list[LineString] = []
    points = [(x * scale, y * scale) for x, y in poly.points]
    for i in range(len(points) - 1):
        segments.append(LineString([points[i], points[i + 1]]))
    return segments


def _closed_polyline_to_polygon(poly: PolylineEntity, scale: float) -> Polygon | None:
    """Convert a closed polyline directly to a Shapely polygon."""
    if len(poly.points) < 3:
        return None
    points = [(x * scale, y * scale) for x, y in poly.points]
    try:
        polygon = Polygon(points)
        return polygon if polygon.is_valid and polygon.area > 0 else None
    except Exception:  # noqa: BLE001
        return None


def _tessellate_arc(arc: ArcEntity, scale: float) -> list[LineString]:
    """Approximate an arc as short line segments."""
    segments: list[LineString] = []
    start_angle = math.radians(arc.start_angle)
    end_angle = math.radians(arc.end_angle)
    radius = arc.radius * scale
    center_x, center_y = arc.center[0] * scale, arc.center[1] * scale

    # Normalize sweep; handle arcs crossing 0 degrees.
    sweep = end_angle - start_angle
    while sweep <= 0:
        sweep += 2 * math.pi

    steps = max(1, int(math.degrees(sweep) / ARC_STEP_DEGREES))
    step = sweep / steps

    prev_x = center_x + radius * math.cos(start_angle)
    prev_y = center_y + radius * math.sin(start_angle)
    for i in range(1, steps + 1):
        angle = start_angle + i * step
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        segments.append(LineString([(prev_x, prev_y), (x, y)]))
        prev_x, prev_y = x, y

    return segments


def _polygon_key(
    polygon: Polygon,
    tolerance: float = SNAP_TOLERANCE,
) -> tuple[tuple[float, float], ...]:
    """Build a canonical key for duplicate polygon detection."""
    coords = list(polygon.exterior.coords)[:-1]
    if not coords:
        return ()
    # Normalize: sort by angle around centroid to make key rotation-invariant.
    centroid = polygon.centroid
    cx, cy = centroid.x, centroid.y
    oriented = sorted(
        coords,
        key=lambda pt: math.atan2(pt[1] - cy, pt[0] - cx),
    )
    rounded = [
        (_snap_coordinate(x, tolerance), _snap_coordinate(y, tolerance))
        for x, y in oriented
    ]
    return tuple(rounded)


class PolygonBuilder:
    """Builds closed polygons from DXF line segments."""

    def build_polygons(
        self,
        entities: DxfEntities,
        scale: float = 1.0,
        min_area_m2: float = MIN_AREA_M2,
    ) -> list[Polygon]:
        """Reconstruct closed polygons from lines, polylines, and arcs.

        Args:
            entities: Entities extracted from a DXF file.
            scale: Scale factor to convert drawing units to meters.
            min_area_m2: Minimum polygon area to keep, in square meters.

        Returns:
            A list of valid, non-duplicate Shapely polygons in meters.
        """
        closed_polyline_polygons: list[Polygon] = []
        line_segments: list[LineString] = []

        # 1. Direct conversion of closed polylines.
        for poly in entities.polylines:
            if poly.is_closed:
                polygon = _closed_polyline_to_polygon(poly, scale)
                if polygon:
                    closed_polyline_polygons.append(polygon)
            else:
                line_segments.extend(_polyline_to_segments(poly, scale))

        # 2. LINE entities.
        for line in entities.lines:
            line_segments.append(
                LineString(
                    [
                        (line.start[0] * scale, line.start[1] * scale),
                        (line.end[0] * scale, line.end[1] * scale),
                    ],
                ),
            )

        # 3. ARC entities as tessellated line segments.
        for arc in entities.arcs:
            line_segments.extend(_tessellate_arc(arc, scale))

        logger.debug(
            "Polygon builder input: %d closed polylines, %d line segments",
            len(closed_polyline_polygons),
            len(line_segments),
        )

        # 4. Snap endpoints and polygonize.
        tolerance = SNAP_TOLERANCE
        snapped_segments = [_round_linestring(seg, tolerance) for seg in line_segments]
        # Drop zero-length or single-point segments.
        snapped_segments = [seg for seg in snapped_segments if len(seg.coords) >= 2]
        polygonized = list(polygonize(snapped_segments))

        # 5. Combine direct polylines and polygonized regions.
        all_polygons = closed_polyline_polygons + polygonized

        # 6. Filter by area and validity.
        filtered: list[Polygon] = []
        filtered_count = 0
        for polygon in all_polygons:
            if not polygon.is_valid:
                continue
            if polygon.area < min_area_m2:
                filtered_count += 1
                continue
            filtered.append(polygon)

        # 7. Remove duplicates (same vertices, possibly different starting point).
        seen: set[tuple[tuple[float, float], ...]] = set()
        unique_polygons: list[Polygon] = []
        for polygon in filtered:
            key = _polygon_key(polygon, tolerance)
            if key not in seen:
                seen.add(key)
                unique_polygons.append(polygon)

        logger.info(
            "Built %d polygons: %d from closed polylines, %d from polygonize, "
            "%d filtered by area",
            len(unique_polygons),
            len(closed_polyline_polygons),
            len(polygonized),
            filtered_count,
        )

        return unique_polygons
