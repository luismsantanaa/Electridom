"""Measurement service — calculates dimensions with scale conversion.

TODO (Fase 3): Implement area, perimeter, and scale detection.
"""


class SpaceMeasurement:
    """Calculates physical dimensions of detected spaces."""

    def calculate(self, polygon, scale: float = 1.0) -> dict:
        """Calculate area (m²), perimeter (m), and bounding box.

        Returns:
        - area_m2: float
        - perimeter_m: float
        - width_m: float (bounding box)
        - length_m: float (bounding box)
        - vertices: list of (x, y) tuples
        """
        raise NotImplementedError("Will be implemented in Fase 3")
