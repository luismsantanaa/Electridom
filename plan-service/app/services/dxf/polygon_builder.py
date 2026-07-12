"""Polygon builder — reconstructs closed polygons from line segments.

TODO (Fase 3): Implement adjacency graph + cycle detection algorithm.
"""


class PolygonBuilder:
    """Builds closed polygons from DXF line segments."""

    def build_polygons(self, entities: dict) -> list:
        """Reconstruct closed polygons from lines and polylines.

        Algorithm:
        1. Collect all LINE and LWPOLYLINE segments
        2. Build adjacency graph: endpoints → connected segments
        3. Find closed cycles using DFS
        4. Filter by minimum area (> 0.5 m²)
        5. Remove duplicates
        """
        raise NotImplementedError("Polygon builder will be implemented in Fase 3")
