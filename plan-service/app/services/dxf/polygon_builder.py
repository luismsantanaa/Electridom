"""Polygon builder — reconstructs closed polygons from line segments."""

from __future__ import annotations

import logging
import math
import statistics
from dataclasses import dataclass

from shapely import LineString, Polygon
from shapely.ops import polygonize, unary_union

from app.services.dxf.parser import (
    ArcEntity,
    DxfEntities,
    PolylineEntity,
)

logger = logging.getLogger(__name__)

# Real-world snap tolerance: 2 millimeters.
SNAP_TOLERANCE = 0.002
# Minimum closed polygon area in square meters. Cells smaller than this are
# wall cavities, symbols, or fixtures — not usable spaces.
MIN_AREA_M2 = 1.5
# Maximum plausible single-space area for a residential plan (m2). Sheet
# frames and whole-lot boundaries are far larger than any real room.
MAX_AREA_M2 = 150.0
# Arc tessellation step in degrees.
ARC_STEP_DEGREES = 5.0
# Tolerance (meters) for translation-invariant duplicate shape detection.
# Sheets copied across a drawing (e.g. arquitectonica/cableado/sanitaria of the
# same floor) repeat identical room shapes at different offsets.
DUPLICATE_SHAPE_TOLERANCE = 0.05
# Max gap (meters) between polygons that belong to the same plan sheet.
SHEET_CLUSTER_GAP_M = 2.0
# Two sheet clusters sharing at least this fraction of room fingerprints are
# copies of the same floor plan (arquitectonica vs cableado vs sanitaria).
# Different floors of the same building share far fewer congruent rooms.
SHEET_MATCH_RATIO = 0.35
# Minimum congruent shapes shared between clusters to call them duplicate
# sheets. A single coincidence (two identical bedrooms) is not a copy.
SHEET_MATCH_MIN_SHARED = 2
# Relative tolerance when comparing cluster footprints (united outline of a
# sheet). Copies of the same floor share the footprint even when internal
# subdivision differs (extra dimension lines, wiring, pipe runs).
SHEET_FOOTPRINT_TOLERANCE = 0.05
# Footprint comparison only applies to clusters that look like real sheets
# (several rooms). Isolated shapes may legitimately repeat within a plan.
SHEET_FOOTPRINT_MIN_POLYGONS = 3
# A polygon at least this large (m2) counts as a room-sized cell when scoring
# which duplicate sheet copy to keep.
ROOM_SIZED_AREA_M2 = 2.5
# Two polygons from different sheet clusters whose aligned shapes overlap at
# least this much (IoU) are copies of the same room.
CONGRUENT_IOU = 0.90
# A polygon whose contained children cover more than this fraction of its own
# area is a container (sheet frame, title block, building outline), not a room.
CONTAINER_COVERAGE_RATIO = 0.6
# Fraction of a polygon's area that must fall inside another polygon to be
# considered "nested" (furniture, fixtures, duplicated inner boundaries).
NESTED_OVERLAP_RATIO = 0.9
# A face whose holes exceed this fraction of its exterior area is a ring
# between a frame and the drawing (page border, lot boundary), not a room.
MAX_HOLE_RATIO = 0.5


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


def _round_linestring(line: LineString, tolerance: float) -> LineString | None:
    """Snap LineString coords to the tolerance grid.

    Returns None when snapping collapses the geometry to fewer than 2 distinct
    points (invalid for Shapely LineString / useless for polygonize).
    """
    coords = list(line.coords)
    if len(coords) < 2:
        return None

    snapped = [_snap_point((x, y), tolerance) for x, y in coords]
    # Drop consecutive duplicates after snap.
    deduped: list[tuple[float, float]] = [snapped[0]]
    for point in snapped[1:]:
        if point != deduped[-1]:
            deduped.append(point)

    if len(deduped) < 2:
        return None

    try:
        return LineString(deduped)
    except Exception:  # noqa: BLE001
        logger.debug("Skipping invalid snapped LineString (%d points)", len(deduped))
        return None


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


def _shape_signature(
    polygon: Polygon,
    tolerance: float = DUPLICATE_SHAPE_TOLERANCE,
) -> tuple[tuple[int, int], ...]:
    """Translation-invariant shape key: vertices relative to bbox min.

    Two congruent polygons at different positions (sheet copies of the same
    floor plan) produce the same signature.
    """
    minx, miny = polygon.bounds[0], polygon.bounds[1]
    coords = list(polygon.exterior.coords)[:-1]
    rel = sorted(
        (round((x - minx) / tolerance), round((y - miny) / tolerance)) for x, y in coords
    )
    return tuple(rel)


def _cluster_by_proximity(
    polygons: list[Polygon],
    gap: float = SHEET_CLUSTER_GAP_M,
) -> list[list[Polygon]]:
    """Group polygons into spatial clusters (one cluster per plan sheet)."""
    n = len(polygons)
    parent = list(range(n))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for i in range(n):
        for j in range(i + 1, n):
            if polygons[i].distance(polygons[j]) <= gap and find(i) != find(j):
                parent[find(j)] = find(i)

    groups: dict[int, list[Polygon]] = {}
    for i, polygon in enumerate(polygons):
        groups.setdefault(find(i), []).append(polygon)
    return list(groups.values())


def _cluster_footprint(cluster: list[Polygon]) -> tuple[float, float, float]:
    """Footprint of a sheet cluster: united outline width, height, and area."""
    united = unary_union(cluster)
    minx, miny, maxx, maxy = united.bounds
    return (maxx - minx, maxy - miny, united.area)


def _footprints_match(
    a: tuple[float, float, float],
    b: tuple[float, float, float],
    tolerance: float = SHEET_FOOTPRINT_TOLERANCE,
) -> bool:
    """True when two cluster footprints agree within the relative tolerance."""
    for va, vb in zip(a, b, strict=True):
        reference = max(abs(va), abs(vb))
        if reference > 0 and abs(va - vb) / reference > tolerance:
            return False
    return True


def _clusters_match(
    cluster_a: list[Polygon],
    fingerprint_a: set[tuple[tuple[int, int], ...]],
    footprint_a: tuple[float, float, float],
    cluster_b: list[Polygon],
    fingerprint_b: set[tuple[tuple[int, int], ...]],
    footprint_b: tuple[float, float, float],
) -> bool:
    """True when two sheet clusters look like copies of the same floor."""
    shared = len(fingerprint_a & fingerprint_b)
    if (
        shared >= SHEET_MATCH_MIN_SHARED
        and shared / min(len(fingerprint_a), len(fingerprint_b)) >= SHEET_MATCH_RATIO
    ):
        return True
    footprint_applicable = (
        min(len(cluster_a), len(cluster_b)) >= SHEET_FOOTPRINT_MIN_POLYGONS
    )
    return footprint_applicable and _footprints_match(footprint_a, footprint_b)


def _drop_duplicate_sheets(polygons: list[Polygon]) -> list[Polygon]:
    """Collapse repeated copies of the same floor plan sheet.

    CAD drawings often place several sheets of the same floor in modelspace
    (architectural, electrical, sanitary...). Each sheet repeats the same
    floor at a different offset. Two clusters are copies when most of their
    room shapes are congruent or their united footprints match. Matching is
    transitive: the sanitary and wiring sheets may each only resemble the
    architectural sheet, yet all three are the same floor, so duplicate
    groups are built with union-find and one representative is kept per group.
    """
    clusters = _cluster_by_proximity(polygons)
    if len(clusters) <= 1:
        return polygons

    fingerprints = [{_shape_signature(p) for p in c} for c in clusters]
    footprints = [_cluster_footprint(c) for c in clusters]

    parent = list(range(len(clusters)))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for i in range(len(clusters)):
        for j in range(i + 1, len(clusters)):
            if find(i) == find(j):
                continue
            if _clusters_match(
                clusters[i],
                fingerprints[i],
                footprints[i],
                clusters[j],
                fingerprints[j],
                footprints[j],
            ):
                parent[find(j)] = find(i)

    groups: dict[int, list[int]] = {}
    for i in range(len(clusters)):
        groups.setdefault(find(i), []).append(i)

    kept_clusters: list[list[Polygon]] = []
    for members in groups.values():
        # Representative: the copy with the most room-sized cells (extra line
        # work like cotas, wiring, or pipes fragments rooms into small cells),
        # breaking ties with the median polygon area.
        best = max(
            members,
            key=lambda idx: (
                sum(1 for p in clusters[idx] if p.area >= ROOM_SIZED_AREA_M2),
                statistics.median(p.area for p in clusters[idx]),
            ),
        )
        kept_clusters.append(clusters[best])

    return _drop_congruent_across_clusters(kept_clusters)


def _normalize_to_origin(polygon: Polygon) -> Polygon:
    """Translate a polygon so its bbox minimum sits at the origin."""
    minx, miny = polygon.bounds[0], polygon.bounds[1]
    exterior = [(x - minx, y - miny) for x, y in polygon.exterior.coords]
    interiors = [
        [(x - minx, y - miny) for x, y in ring.coords] for ring in polygon.interiors
    ]
    return Polygon(exterior, interiors)


def _drop_congruent_across_clusters(
    kept_clusters: list[list[Polygon]],
) -> list[Polygon]:
    """Drop rooms congruent with rooms already kept from another cluster.

    Sheets that only partially match (e.g. a wiring sheet showing part of the
    floor) survive sheet-level dedupe, but their individual rooms are still
    copies. Congruence is checked with the IoU of origin-aligned shapes, which
    tolerates small vertex noise better than an exact signature. Rooms inside
    the same cluster are never compared, and single-polygon clusters are left
    alone: an isolated shape may legitimately repeat within one plan.
    """
    kept_clusters = sorted(kept_clusters, key=len, reverse=True)
    seen: list[Polygon] = []
    result: list[Polygon] = []
    for cluster in kept_clusters:
        multi_polygon_cluster = len(cluster) >= 2
        added: list[Polygon] = []
        for polygon in cluster:
            normalized = _normalize_to_origin(polygon)
            duplicate = False
            if multi_polygon_cluster:
                for other in seen:
                    if abs(other.area - normalized.area) / max(other.area, 1e-9) > (
                        1.0 - CONGRUENT_IOU
                    ):
                        continue
                    try:
                        intersection = normalized.intersection(other).area
                        union = normalized.union(other).area
                    except Exception:  # noqa: BLE001
                        continue
                    if union > 0 and intersection / union >= CONGRUENT_IOU:
                        duplicate = True
                        break
            if not duplicate:
                result.append(polygon)
                added.append(normalized)
        if multi_polygon_cluster:
            seen.extend(added)
    return result


def _remove_containers_and_nested(polygons: list[Polygon]) -> list[Polygon]:
    """Keep room-level polygons only.

    1. Drop containers: polygons whose contained children cover most of their
       own area (sheet frames, title-block cards, whole-building outlines).
    2. Drop nested leftovers: polygons mostly inside a kept polygon
       (furniture blocks, fixture symbols, duplicated inner boundaries).
    """
    if len(polygons) <= 1:
        return polygons

    ordered = sorted(polygons, key=lambda p: p.area, reverse=True)

    # Pass 1: identify containers from largest to smallest.
    dropped: set[int] = set()
    for i, outer in enumerate(ordered):
        if i in dropped:
            continue
        contained_area = 0.0
        for j, inner in enumerate(ordered):
            if i == j or j in dropped:
                continue
            if inner.area >= outer.area:
                continue
            try:
                overlap = outer.intersection(inner).area
            except Exception:  # noqa: BLE001
                continue
            if overlap >= NESTED_OVERLAP_RATIO * inner.area:
                contained_area += inner.area
        if outer.area > 0 and contained_area / outer.area >= CONTAINER_COVERAGE_RATIO:
            dropped.add(i)

    survivors = [p for i, p in enumerate(ordered) if i not in dropped]

    # Pass 2: drop polygons nested inside a kept (larger) polygon.
    result: list[Polygon] = []
    for i, polygon in enumerate(survivors):
        nested = False
        for j, other in enumerate(survivors):
            if i == j or other.area <= polygon.area:
                continue
            try:
                overlap = polygon.intersection(other).area
            except Exception:  # noqa: BLE001
                continue
            if overlap >= NESTED_OVERLAP_RATIO * polygon.area:
                nested = True
                break
        if not nested:
            result.append(polygon)

    return result


class PolygonBuilder:
    """Builds closed polygons from DXF line segments."""

    def build_polygons(
        self,
        entities: DxfEntities,
        scale: float = 1.0,
        min_area_m2: float = MIN_AREA_M2,
        max_area_m2: float | None = MAX_AREA_M2,
        snap_tolerance: float = SNAP_TOLERANCE,
    ) -> list[Polygon]:
        """Reconstruct closed polygons from lines, polylines, and arcs.

        Args:
            entities: Entities extracted from a DXF file.
            scale: Scale factor to convert drawing units to meters.
            min_area_m2: Minimum polygon area to keep, in square meters.
            max_area_m2: Maximum polygon area to keep; None disables the cap
                (used when input units are not calibrated to meters).
            snap_tolerance: Endpoint snapping tolerance in meters. PDF line
                work needs a coarser grid than native CAD geometry.

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

        # 4. Snap endpoints, node the line work, and polygonize. Noding with
        #    unary_union splits segments at every crossing; polygonize only
        #    forms rings from segments that share endpoints, so un-noded
        #    crossing lines (typical in PDF exports) would yield no rooms.
        tolerance = snap_tolerance
        snapped_segments = [
            seg
            for seg in (_round_linestring(s, tolerance) for s in line_segments)
            if seg is not None and len(seg.coords) >= 2
        ]
        if snapped_segments:
            try:
                noded = unary_union(snapped_segments)
            except Exception:  # noqa: BLE001
                logger.warning("Noding failed; polygonizing raw segments")
                noded = snapped_segments
        else:
            noded = snapped_segments
        polygonized = list(polygonize(noded))

        # 5. Combine direct polylines and polygonized regions.
        all_polygons = closed_polyline_polygons + polygonized

        # 6. Filter by area and validity.
        filtered: list[Polygon] = []
        filtered_count = 0
        for polygon in all_polygons:
            if not polygon.is_valid:
                continue
            if polygon.area < min_area_m2 or (
                max_area_m2 is not None and polygon.area > max_area_m2
            ):
                filtered_count += 1
                continue
            if polygon.interiors:
                exterior_area = Polygon(polygon.exterior).area
                if (
                    exterior_area > 0
                    and (exterior_area - polygon.area) / exterior_area > MAX_HOLE_RATIO
                ):
                    filtered_count += 1
                    continue
            filtered.append(polygon)

        # 7. Remove exact duplicates (same vertices, any starting point).
        seen: set[tuple[tuple[float, float], ...]] = set()
        unique_polygons: list[Polygon] = []
        for polygon in filtered:
            key = _polygon_key(polygon, tolerance)
            if key not in seen:
                seen.add(key)
                unique_polygons.append(polygon)

        # 8. Keep room-level polygons: drop sheet frames / title blocks
        #    (containers) and furniture / fixtures (nested shapes). This must
        #    run while all sheet copies are still present so each frame is
        #    matched against the rooms it actually contains.
        room_level = _remove_containers_and_nested(unique_polygons)

        # 9. Collapse repeated copies of the same floor plan sheet.
        rooms = _drop_duplicate_sheets(room_level)

        logger.info(
            "Built %d polygons: %d from closed polylines, %d from polygonize, "
            "%d filtered by area, %d containers/nested removed, "
            "%d congruent copies removed",
            len(rooms),
            len(closed_polyline_polygons),
            len(polygonized),
            filtered_count,
            len(unique_polygons) - len(room_level),
            len(room_level) - len(rooms),
        )

        return rooms
