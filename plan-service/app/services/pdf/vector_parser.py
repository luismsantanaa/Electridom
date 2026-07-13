"""PDF vector parser — extracts vectorial paths from PDF using PyMuPDF."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from shapely import LineString, Point

from app.services.dxf.parser import DxfEntities, LineEntity, TextEntity
from app.services.dxf.polygon_builder import PolygonBuilder

logger = logging.getLogger(__name__)

# PDF points are 1/72 inch. This constant converts points to meters when the
# drawing was authored in real-world points.
_POINTS_TO_METERS = 0.000352778
# Minimum line segment length in PDF points to keep as geometry.
_MIN_SEGMENT_LENGTH_POINTS = 1.0
# Flatness tolerance for Bezier subdivision, in PDF points.
_BEZIER_TOLERANCE_POINTS = 0.5


@dataclass
class PdfTextEntity:
    """Text extracted from a PDF page for classification purposes."""

    content: str
    position: tuple[float, float]


class PdfVectorParser:
    """Parses vectorial PDFs (exported from AutoCAD/Revit)."""

    def __init__(self, scale: float = 1.0):
        self.scale = scale

    def parse(self, file_path: str) -> list[Any]:
        """Extract closed polygons from a vectorial PDF.

        Args:
            file_path: Path to the PDF file on disk.

        Returns:
            A list of Shapely polygons in meters.

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
        all_lines: list[LineEntity] = []
        all_texts: list[TextEntity] = []

        try:
            for page in doc:
                lines, texts = self._extract_drawings(page)
                all_lines.extend(lines)
                all_texts.extend(texts)
        finally:
            doc.close()

        logger.info(
            "Extracted %d line segments and %d text items from %s",
            len(all_lines),
            len(all_texts),
            path.name,
        )

        entities = DxfEntities(lines=all_lines, texts=all_texts)
        builder = PolygonBuilder()
        polygons = builder.build_polygons(entities, scale=self.scale)
        return polygons

    def _extract_drawings(
        self,
        page: Any,
    ) -> tuple[list[LineEntity], list[TextEntity]]:
        """Extract line segments and text from a PDF page.

        Args:
            page: A PyMuPDF page object.

        Returns:
            Tuple of (line_entities, text_entities).
        """
        line_entities: list[LineEntity] = []

        for path in page.get_drawings():
            for item in path.get("items", []):
                line_strings = self._item_to_lines(item)
                for line in line_strings:
                    if line.length >= _MIN_SEGMENT_LENGTH_POINTS:
                        coords = list(line.coords)
                        line_entities.append(
                            LineEntity(
                                start=(float(coords[0][0]), float(coords[0][1])),
                                end=(float(coords[-1][0]), float(coords[-1][1])),
                            ),
                        )

        text_entities = self._extract_texts(page)
        return line_entities, text_entities

    def _item_to_lines(self, item: tuple[Any, ...]) -> list[LineString]:
        """Convert a PyMuPDF drawing item into LineString segments."""
        if not item:
            return []

        kind = item[0]

        if kind == "l" and len(item) >= 3:
            p1, p2 = item[1], item[2]
            return [LineString([(p1.x, p1.y), (p2.x, p2.y)])]

        if kind == "re" and len(item) >= 2:
            rect = item[1]
            return self._rect_to_lines(rect)

        if kind == "qu" and len(item) >= 2:
            quad = item[1]
            return self._quad_to_lines(quad)

        if kind == "c" and len(item) >= 5:
            p1, p2, p3, p4 = item[1], item[2], item[3], item[4]
            return self._bezier_to_lines(p1, p2, p3, p4)

        logger.debug("Skipping unsupported PDF drawing item type: %s", kind)
        return []

    @staticmethod
    def _rect_to_lines(rect: Any) -> list[LineString]:
        """Return the four edges of a PDF rectangle."""
        return [
            LineString([(rect.x0, rect.y0), (rect.x1, rect.y0)]),
            LineString([(rect.x1, rect.y0), (rect.x1, rect.y1)]),
            LineString([(rect.x1, rect.y1), (rect.x0, rect.y1)]),
            LineString([(rect.x0, rect.y1), (rect.x0, rect.y0)]),
        ]

    @staticmethod
    def _quad_to_lines(quad: Any) -> list[LineString]:
        """Return the four edges of a PDF quadrilateral."""
        pts = list(quad)
        if len(pts) < 4:
            return []
        return [
            LineString([(pts[0].x, pts[0].y), (pts[1].x, pts[1].y)]),
            LineString([(pts[1].x, pts[1].y), (pts[2].x, pts[2].y)]),
            LineString([(pts[2].x, pts[2].y), (pts[3].x, pts[3].y)]),
            LineString([(pts[3].x, pts[3].y), (pts[0].x, pts[0].y)]),
        ]

    def _bezier_to_lines(
        self,
        p1: Any,
        p2: Any,
        p3: Any,
        p4: Any,
        tolerance: float = _BEZIER_TOLERANCE_POINTS,
    ) -> list[LineString]:
        """Tessellate a cubic Bezier curve into line segments.

        Uses De Casteljau subdivision with a flatness test. When the control
        points are close enough to the chord from ``p1`` to ``p4`` the curve is
        approximated by a single line segment.
        """
        segments: list[LineString] = []
        self._subdivide_bezier(
            (p1.x, p1.y),
            (p2.x, p2.y),
            (p3.x, p3.y),
            (p4.x, p4.y),
            tolerance,
            segments,
        )
        return segments

    def _subdivide_bezier(
        self,
        p1: tuple[float, float],
        p2: tuple[float, float],
        p3: tuple[float, float],
        p4: tuple[float, float],
        tolerance: float,
        output: list[LineString],
    ) -> None:
        """Recursively subdivide a cubic Bezier until it is flat enough."""
        if self._is_flat(p1, p2, p3, p4, tolerance):
            output.append(LineString([p1, p4]))
            return

        # De Casteljau subdivision at t = 0.5.
        m12 = self._midpoint(p1, p2)
        m23 = self._midpoint(p2, p3)
        m34 = self._midpoint(p3, p4)
        m123 = self._midpoint(m12, m23)
        m234 = self._midpoint(m23, m34)
        m = self._midpoint(m123, m234)

        self._subdivide_bezier(p1, m12, m123, m, tolerance, output)
        self._subdivide_bezier(m, m234, m34, p4, tolerance, output)

    @staticmethod
    def _midpoint(a: tuple[float, float], b: tuple[float, float]) -> tuple[float, float]:
        """Return the midpoint of two points."""
        return ((a[0] + b[0]) / 2.0, (a[1] + b[1]) / 2.0)

    @staticmethod
    def _is_flat(
        p1: tuple[float, float],
        p2: tuple[float, float],
        p3: tuple[float, float],
        p4: tuple[float, float],
        tolerance: float,
    ) -> bool:
        """Return True if the control polygon is close to the chord p1-p4."""
        # Distance from p2 and p3 to the chord p1-p4.
        return (
            PdfVectorParser._point_line_distance(p2, p1, p4) <= tolerance
            and PdfVectorParser._point_line_distance(p3, p1, p4) <= tolerance
        )

    @staticmethod
    def _point_line_distance(
        point: tuple[float, float],
        line_start: tuple[float, float],
        line_end: tuple[float, float],
    ) -> float:
        """Return the perpendicular distance from a point to a line segment."""
        px, py = point
        x1, y1 = line_start
        x2, y2 = line_end

        dx = x2 - x1
        dy = y2 - y1
        segment_length_sq = dx * dx + dy * dy

        if segment_length_sq == 0:
            return ((px - x1) ** 2 + (py - y1) ** 2) ** 0.5

        t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / segment_length_sq))
        projection_x = x1 + t * dx
        projection_y = y1 + t * dy

        return ((px - projection_x) ** 2 + (py - projection_y) ** 2) ** 0.5

    @staticmethod
    def _extract_texts(page: Any) -> list[TextEntity]:
        """Extract text blocks with their positions from a PDF page."""
        texts: list[TextEntity] = []
        for block in page.get_text("blocks"):
            # blocks format: (x0, y0, x1, y1, text, block_no, block_type)
            if len(block) < 5:
                continue
            x0, y0, x1, y1, content = block[0], block[1], block[2], block[3], block[4]
            if not isinstance(content, str) or not content.strip():
                continue
            centroid = Point((x0 + x1) / 2.0, (y0 + y1) / 2.0)
            texts.append(
                TextEntity(
                    content=content.strip(),
                    position=(float(centroid.x), float(centroid.y)),
                    text_type="PDF_TEXT",
                ),
            )
        return texts
