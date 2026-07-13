"""Measurement service — calculates dimensions with scale conversion."""

from __future__ import annotations

from dataclasses import dataclass

from shapely import Polygon


@dataclass
class SpaceDimensions:
    """Physical dimensions of a detected space."""

    area_m2: float
    perimeter_m: float
    width_m: float
    length_m: float
    vertices: list[tuple[float, float]]


class SpaceMeasurement:
    """Calculates physical dimensions of detected spaces."""

    def calculate(self, polygon: Polygon, scale: float = 1.0) -> SpaceDimensions:
        """Calculate area (m²), perimeter (m), and bounding box.

        Args:
            polygon: A Shapely polygon.
            scale: Scale factor to convert drawing units to meters.

        Returns:
            SpaceDimensions with area, perimeter, bounding box, and vertices.
        """
        area_m2 = float(polygon.area) * (scale**2)
        perimeter_m = float(polygon.length) * scale

        minx, miny, maxx, maxy = polygon.bounds
        width_m = (maxx - minx) * scale
        length_m = (maxy - miny) * scale

        # Exterior coords include a duplicated closing point; drop it.
        coords = list(polygon.exterior.coords)[:-1]
        vertices = [(float(x), float(y)) for x, y in coords]

        return SpaceDimensions(
            area_m2=area_m2,
            perimeter_m=perimeter_m,
            width_m=width_m,
            length_m=length_m,
            vertices=vertices,
        )
