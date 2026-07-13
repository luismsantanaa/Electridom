"""PDF raster parser — processes scanned PDFs using OpenCV."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import numpy as np
from shapely import LineString, Polygon
from shapely.ops import polygonize

logger = logging.getLogger(__name__)

# Minimum closed polygon area in square meters.
_MIN_AREA_M2 = 0.5
# Minimum contour area in pixels to avoid noise.
_MIN_CONTOUR_AREA_PIXELS = 100
# Approximation epsilon ratio for cv2.approxPolyDP.
_APPROX_EPSILON_RATIO = 0.01
# Minimum line length for HoughLinesP as a fraction of image diagonal.
_MIN_LINE_DIAGONAL_FRACTION = 0.03
# Maximum gap between collinear line segments.
_MAX_LINE_GAP_DIAGONAL_FRACTION = 0.01


class PdfRasterParser:
    """Parses raster PDFs (scanned images) using computer vision."""

    def __init__(self, scale: float = 1.0, dpi: int = 300):
        self.scale = scale
        self.dpi = dpi

    def parse(self, file_path: str) -> list[Polygon]:
        """Extract closed polygons from a raster PDF.

        Args:
            file_path: Path to the PDF file on disk.

        Returns:
            A list of valid Shapely polygons in meters.

        Raises:
            FileNotFoundError: If the file does not exist.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"PDF file not found: {file_path}")

        try:
            import pymupdf
        except ImportError:  # pragma: no cover - fallback import
            import fitz as pymupdf  # type: ignore[no-redef]

        doc = pymupdf.open(str(path))
        all_segments: list[LineString] = []

        try:
            for page in doc:
                image = self._render_page(page)
                binary = self._preprocess(image)
                contour_lines = self._detect_contours(binary)
                hough_lines = self._detect_lines(binary)
                all_segments.extend(contour_lines)
                all_segments.extend(hough_lines)
        finally:
            doc.close()

        logger.info(
            "Raster parser extracted %d segments from %s",
            len(all_segments),
            path.name,
        )

        polygons = list(polygonize(all_segments))
        return self._filter_polygons(polygons)

    def _render_page(self, page: Any) -> np.ndarray:
        """Render a PDF page to a numpy array at the configured DPI."""
        import io

        import cv2
        from PIL import Image

        pixmap = page.get_pixmap(dpi=self.dpi)
        # Render via PNG bytes to handle any colorspace robustly.
        img = Image.open(io.BytesIO(pixmap.tobytes("png")))
        return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

    def _preprocess(self, image: np.ndarray) -> np.ndarray:
        """Grayscale + denoise + adaptive threshold → binary image."""
        import cv2

        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image

        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        binary = cv2.adaptiveThreshold(
            denoised,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            11,
            2,
        )
        return binary

    def _detect_contours(self, binary: np.ndarray) -> list[LineString]:
        """Find contours and convert them to Shapely LineStrings."""
        import cv2

        contours, _ = cv2.findContours(
            binary,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE,
        )

        segments: list[LineString] = []
        for contour in contours:
            if cv2.contourArea(contour) < _MIN_CONTOUR_AREA_PIXELS:
                continue

            polygon = self._contour_to_polygon(contour)
            if polygon is None or not polygon.is_valid:
                continue

            coords = list(polygon.exterior.coords)
            for i in range(len(coords) - 1):
                segments.append(LineString([coords[i], coords[i + 1]]))

        return segments

    def _detect_lines(self, binary: np.ndarray) -> list[LineString]:
        """Detect line segments with HoughLinesP and convert to LineStrings."""
        import cv2

        edges = cv2.Canny(binary, 50, 150)
        height, width = edges.shape[:2]
        diagonal = (height**2 + width**2) ** 0.5
        min_line_length = int(diagonal * _MIN_LINE_DIAGONAL_FRACTION)
        max_line_gap = int(diagonal * _MAX_LINE_GAP_DIAGONAL_FRACTION)

        lines = cv2.HoughLinesP(
            edges,
            rho=1,
            theta=np.pi / 180,
            threshold=50,
            minLineLength=max(30, min_line_length),
            maxLineGap=max(10, max_line_gap),
        )

        segments: list[LineString] = []
        if lines is None:
            return segments

        for line in lines:
            # OpenCV returns either (n, 1, 4) or (n, 4) depending on version.
            coords = line[0] if line.ndim == 3 else line
            x1, y1, x2, y2 = coords
            segments.append(LineString([(x1, y1), (x2, y2)]))

        return segments

    def _contour_to_polygon(self, contour: np.ndarray) -> Polygon | None:
        """Convert an OpenCV contour to a simplified Shapely Polygon."""
        import cv2

        epsilon = _APPROX_EPSILON_RATIO * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)

        if len(approx) < 3:
            return None

        # Convert pixel coordinates to meters using the configured scale.
        points = [
            self._pixel_to_meters(float(pt[0][0]), float(pt[0][1]))
            for pt in approx
        ]

        try:
            polygon = Polygon(points)
            return polygon if polygon.is_valid and polygon.area > 0 else None
        except Exception:  # noqa: BLE001
            return None

    def _pixel_to_meters(self, x: float, y: float) -> tuple[float, float]:
        """Convert pixel coordinates to meters using DPI and scale."""
        meters_per_pixel = 0.0254 / self.dpi
        return (x * meters_per_pixel * self.scale, y * meters_per_pixel * self.scale)

    def _filter_polygons(self, polygons: list[Polygon]) -> list[Polygon]:
        """Filter polygons by validity, minimum area, and deduplicate."""
        seen: set[int] = set()
        filtered: list[Polygon] = []

        for polygon in polygons:
            if not polygon.is_valid:
                continue
            if polygon.area < _MIN_AREA_M2:
                continue

            # Simple deduplication using rounded centroid + area.
            centroid = polygon.centroid
            key = hash(
                (
                    round(float(centroid.x), 3),
                    round(float(centroid.y), 3),
                    round(float(polygon.area), 3),
                ),
            )
            if key in seen:
                continue
            seen.add(key)
            filtered.append(polygon)

        return filtered
