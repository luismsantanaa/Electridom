"""OCR engine — text extraction from plan images."""

from __future__ import annotations

import logging
from typing import cast

import numpy as np
from PIL import Image
from shapely import Polygon

logger = logging.getLogger(__name__)

try:
    import pytesseract
except ImportError:  # pragma: no cover - optional dependency
    pytesseract = None


class OcrEngine:
    """OCR engine for text extraction from plan images.

    Uses pytesseract if available. Falls back to an empty string if Tesseract
    is not installed, which keeps the pipeline testable in CI environments.
    """

    def __init__(self, language: str = "spa"):
        self.language = language
        self._tesseract_available = self._check_tesseract()

    def _check_tesseract(self) -> bool:
        """Check whether pytesseract and the Tesseract binary are available."""
        if pytesseract is None:
            return False
        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception as exc:  # noqa: BLE001
            logger.debug("Tesseract not available: %s", exc)
            return False

    def extract_text(self, image: np.ndarray, region: Polygon | None = None) -> str:
        """Extract text from an image or a region of an image.

        Args:
            image: Input image as a numpy array.
            region: Optional Shapely polygon defining the region to OCR. When
                provided, the image is cropped to the region's bounding box.

        Returns:
            Extracted text, or an empty string if Tesseract is unavailable.
        """
        if not self._tesseract_available:
            return ""

        try:
            crop = self._crop_image(image, region)
            text = pytesseract.image_to_string(
                Image.fromarray(crop),
                lang=self.language,
            )
            return cast("str", text.strip())
        except Exception as exc:  # noqa: BLE001
            logger.warning("OCR extraction failed: %s", exc)
            return ""

    def _crop_image(
        self,
        image: np.ndarray,
        region: Polygon | None,
    ) -> np.ndarray:
        """Crop the image to the region's bounding box, if provided."""
        if region is None:
            return image

        minx, miny, maxx, maxy = region.bounds
        height, width = image.shape[:2]

        x1 = max(0, int(minx))
        y1 = max(0, int(miny))
        x2 = min(width, int(maxx) + 1)
        y2 = min(height, int(maxy) + 1)

        if x1 >= x2 or y1 >= y2:
            return image

        return image[y1:y2, x1:x2]
