"""PDF/image raster parser — OpenCV room segmentation for scanned plans."""

from __future__ import annotations

import logging
import math
import statistics
from pathlib import Path
from typing import Any, cast

import numpy as np
from shapely import LineString, Polygon
from shapely.ops import polygonize

logger = logging.getLogger(__name__)

# Minimum closed polygon area in square meters (print-scale PDFs).
_MIN_AREA_M2 = 0.5
# Minimum contour area in pixels to avoid noise.
_MIN_CONTOUR_AREA_PIXELS = 100
# Approximation epsilon ratio for cv2.approxPolyDP.
_APPROX_EPSILON_RATIO = 0.01
# Minimum line length for HoughLinesP as a fraction of image diagonal.
_MIN_LINE_DIAGONAL_FRACTION = 0.03
# Maximum gap between collinear line segments.
_MAX_LINE_GAP_DIAGONAL_FRACTION = 0.01

# Image (PNG) room segmentation — screen exports are not print-DPI calibrated.
_ROOM_MIN_IMAGE_FRAC = 0.004
_ROOM_MAX_IMAGE_FRAC = 0.20
_WALL_DILATE_PX = 4
_BORDER_SEAL_PX = 4
# Typical median room size used to recover meters-per-pixel on unlabeled PNGs.
_TYPICAL_MEDIAN_ROOM_M2 = 12.0
_MIN_ROOM_AREA_M2_IMAGE = 1.5


class PdfRasterParser:
    """Parses raster PDFs (scanned images) and plan PNGs using computer vision."""

    def __init__(self, scale: float = 1.0, dpi: int = 300):
        self.scale = scale
        self.dpi = dpi
        # Set by parse_image so callers can map OCR pixel coords → meters.
        self.last_meters_per_pixel: float = 0.0254 / max(dpi, 1)

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
            import fitz as pymupdf

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

    def parse_image(self, file_path: str) -> list[Polygon]:
        """Extract room polygons from a plan image (PNG/JPG).

        Screen-exported architectural PNGs rarely form closed loops via Hough
        line polygonize (doors, dimension ticks, furniture). Instead we:
        1. Threshold wall ink and dilate to seal door gaps
        2. Find connected white components (rooms) with a size filter
        3. Convert pixels → meters using a room-size scale estimate

        Args:
            file_path: Path to the image file on disk.

        Returns:
            A list of valid Shapely polygons in meters.

        Raises:
            FileNotFoundError: If the file does not exist.
            ValueError: If the image cannot be decoded.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Image file not found: {file_path}")

        image = self._load_image(str(path))
        gray = self._to_gray(image)
        room_contours, pixel_areas = self._segment_room_contours(gray)

        if not room_contours:
            logger.info(
                "Room segmentation found 0 rooms in %s; trying Hough fallback",
                path.name,
            )
            return self._parse_image_hough_fallback(image)

        meters_per_pixel = self._estimate_meters_per_pixel(pixel_areas)
        self.last_meters_per_pixel = meters_per_pixel
        polygons: list[Polygon] = []
        for contour in room_contours:
            polygon = self._contour_to_polygon_mpp(contour, meters_per_pixel)
            if polygon is None:
                continue
            if polygon.area < _MIN_ROOM_AREA_M2_IMAGE:
                continue
            polygons.append(polygon)

        logger.info(
            "Raster image parser found %d rooms in %s (mpp=%.6f)",
            len(polygons),
            path.name,
            meters_per_pixel,
        )
        return self._dedupe_polygons(polygons)

    def _parse_image_hough_fallback(self, image: np.ndarray) -> list[Polygon]:
        """Legacy Hough + polygonize path when CC segmentation finds nothing."""
        binary = self._preprocess(image)
        all_segments: list[LineString] = []
        all_segments.extend(self._detect_contours(binary))
        all_segments.extend(self._detect_lines(binary))
        polygons = list(polygonize(all_segments))
        return self._filter_polygons(polygons)

    def _segment_room_contours(
        self,
        gray: np.ndarray,
    ) -> tuple[list[np.ndarray], list[int]]:
        """Return OpenCV contours and pixel areas for room-sized components."""
        import cv2

        height, width = gray.shape[:2]
        image_area = height * width

        _, walls = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT,
            (_WALL_DILATE_PX, _WALL_DILATE_PX),
        )
        walls = cv2.dilate(walls, kernel, iterations=1)

        rooms = cv2.bitwise_not(walls)
        # Seal the image border so the exterior page background is not a room.
        cv2.rectangle(
            rooms,
            (0, 0),
            (width - 1, height - 1),
            0,
            _BORDER_SEAL_PX,
        )

        num_labels, labels, stats, _centroids = cv2.connectedComponentsWithStats(
            rooms,
            connectivity=8,
        )

        contours: list[np.ndarray] = []
        areas: list[int] = []
        min_area = int(image_area * _ROOM_MIN_IMAGE_FRAC)
        max_area = int(image_area * _ROOM_MAX_IMAGE_FRAC)

        for label_id in range(1, num_labels):
            area = int(stats[label_id, cv2.CC_STAT_AREA])
            if area < min_area or area > max_area:
                continue

            mask = np.zeros((height, width), dtype=np.uint8)
            mask[labels == label_id] = 255
            found, _hierarchy = cv2.findContours(
                mask,
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE,
            )
            if not found:
                continue
            contour = max(found, key=cv2.contourArea)
            if cv2.contourArea(contour) < _MIN_CONTOUR_AREA_PIXELS:
                continue
            contours.append(contour)
            areas.append(area)

        return contours, areas

    @staticmethod
    def _estimate_meters_per_pixel(pixel_areas: list[int]) -> float:
        """Infer meters/pixel so the median room is a typical apartment size."""
        if not pixel_areas:
            return 0.0254 / 150.0
        median_px = float(statistics.median(pixel_areas))
        if median_px <= 0:
            return 0.0254 / 150.0
        return math.sqrt(_TYPICAL_MEDIAN_ROOM_M2 / median_px)

    def _contour_to_polygon_mpp(
        self,
        contour: np.ndarray,
        meters_per_pixel: float,
    ) -> Polygon | None:
        """Convert a contour to a Shapely polygon using an explicit m/px factor."""
        import cv2

        epsilon = _APPROX_EPSILON_RATIO * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)
        if len(approx) < 3:
            return None

        points = [
            (
                float(pt[0][0]) * meters_per_pixel * self.scale,
                float(pt[0][1]) * meters_per_pixel * self.scale,
            )
            for pt in approx
        ]
        try:
            polygon = Polygon(points)
            return polygon if polygon.is_valid and polygon.area > 0 else None
        except Exception:  # noqa: BLE001
            return None

    @staticmethod
    def _load_image(file_path: str) -> np.ndarray:
        """Load an image file as a BGR numpy array."""
        import cv2
        from PIL import Image

        with Image.open(file_path) as img:
            rgb = img.convert("RGB")
            array = np.array(rgb)

        if array.size == 0:
            raise ValueError(f"Could not decode image: {file_path}")

        return cast("np.ndarray", cv2.cvtColor(array, cv2.COLOR_RGB2BGR))

    @staticmethod
    def _to_gray(image: np.ndarray) -> np.ndarray:
        """Convert BGR/gray image to a single-channel grayscale array."""
        import cv2

        if len(image.shape) == 3:
            return cast("np.ndarray", cv2.cvtColor(image, cv2.COLOR_BGR2GRAY))
        return image

    def _render_page(self, page: Any) -> np.ndarray:
        """Render a PDF page to a numpy array at the configured DPI."""
        import io

        import cv2
        from PIL import Image

        pixmap = page.get_pixmap(dpi=self.dpi)
        # Render via PNG bytes to handle any colorspace robustly.
        img = Image.open(io.BytesIO(pixmap.tobytes("png")))
        return cast("np.ndarray", cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR))

    def _preprocess(self, image: np.ndarray) -> np.ndarray:
        """Grayscale + denoise + adaptive threshold → binary image."""
        import cv2

        gray = self._to_gray(image)
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        binary = cv2.adaptiveThreshold(
            denoised,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            11,
            2,
        )
        return cast("np.ndarray", binary)

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
        filtered: list[Polygon] = []
        for polygon in polygons:
            if not polygon.is_valid:
                continue
            if polygon.area < _MIN_AREA_M2:
                continue
            filtered.append(polygon)
        return self._dedupe_polygons(filtered)

    @staticmethod
    def _dedupe_polygons(polygons: list[Polygon]) -> list[Polygon]:
        """Drop near-duplicate polygons by rounded centroid + area."""
        seen: set[int] = set()
        unique: list[Polygon] = []
        for polygon in polygons:
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
            unique.append(polygon)
        return unique
