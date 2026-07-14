"""PDF type detector — classifies PDFs as vectorial, raster, or mixed."""

from __future__ import annotations

import logging
from enum import Enum
from pathlib import Path

logger = logging.getLogger(__name__)


class PdfType(Enum):
    """Classification of a PDF's content type."""

    VECTORIAL = "vectorial"
    RASTER = "raster"
    MIXED = "mixed"


class PdfTypeDetector:
    """Detects whether a PDF is vectorial, raster, or mixed."""

    def detect(self, file_path: str) -> PdfType:
        """Classify the PDF at ``file_path``.

        Algorithm:
        1. Open the PDF with PyMuPDF.
        2. For each page check ``page.get_drawings()`` and ``page.get_images()``.
        3. Aggregate across pages:
           - All pages have drawings and no images → VECTORIAL
           - No drawings and all pages have images → RASTER
           - Both present on at least one page → MIXED
           - Empty / no content → VECTORIAL (default)

        Args:
            file_path: Path to the PDF file on disk.

        Returns:
            A ``PdfType`` classification value.

        Raises:
            FileNotFoundError: If the file does not exist.
            RuntimeError: If the file cannot be opened as a PDF.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"PDF file not found: {file_path}")

        try:
            import pymupdf
        except ImportError:  # pragma: no cover - fallback import
            import fitz as pymupdf

        doc = pymupdf.open(str(path))
        try:
            has_drawings = False
            has_images = False
            total_pages = len(doc)

            for page in doc:
                if page.get_drawings():
                    has_drawings = True
                if page.get_images():
                    has_images = True

                if has_drawings and has_images:
                    break

            logger.debug(
                "PDF type detection for %s: pages=%d, drawings=%s, images=%s",
                path.name,
                total_pages,
                has_drawings,
                has_images,
            )

            if has_drawings and has_images:
                return PdfType.MIXED
            if has_images:
                return PdfType.RASTER
            return PdfType.VECTORIAL
        finally:
            doc.close()
