"""PDF mixed parser — combines vectorial and raster extraction."""

from __future__ import annotations

import logging

from shapely import Polygon

from app.services.pdf.raster_parser import PdfRasterParser
from app.services.pdf.vector_parser import PdfVectorParser

logger = logging.getLogger(__name__)

# Two polygons overlap significantly when their intersection area is more than
# this fraction of the smaller polygon's area.
_OVERLAP_THRESHOLD = 0.5


class PdfMixedParser:
    """Parses mixed PDFs by combining vector and raster extraction."""

    def __init__(
        self,
        vector_parser: PdfVectorParser,
        raster_parser: PdfRasterParser,
    ):
        self.vector_parser = vector_parser
        self.raster_parser = raster_parser

    def parse(self, file_path: str) -> list[Polygon]:
        """Extract polygons from a mixed PDF.

        Vectorial polygons are preferred because they are more precise. Raster
        polygons that overlap significantly with a vectorial polygon are
        discarded to avoid duplicates.

        Args:
            file_path: Path to the PDF file on disk.

        Returns:
            Combined list of Shapely polygons in meters.
        """
        vector_polygons = self.vector_parser.parse(file_path)
        raster_polygons = self.raster_parser.parse(file_path)

        kept_raster: list[Polygon] = []
        for raster in raster_polygons:
            if not self._overlaps_significantly(raster, vector_polygons):
                kept_raster.append(raster)

        logger.info(
            "Mixed parser: %d vector + %d raster kept (removed %d overlaps)",
            len(vector_polygons),
            len(kept_raster),
            len(raster_polygons) - len(kept_raster),
        )

        return vector_polygons + kept_raster

    def _overlaps_significantly(
        self,
        raster: Polygon,
        vector_polygons: list[Polygon],
    ) -> bool:
        """Return True if the raster polygon overlaps any vector polygon."""
        if not raster.is_valid:
            return False

        raster_area = raster.area
        if raster_area <= 0:
            return False

        for vector in vector_polygons:
            if not vector.is_valid:
                continue
            try:
                intersection = raster.intersection(vector)
            except Exception:  # noqa: BLE001
                continue

            if not intersection.is_valid:
                continue

            min_area = min(raster_area, vector.area)
            if min_area <= 0:
                continue

            if intersection.area / min_area > _OVERLAP_THRESHOLD:
                return True

        return False
