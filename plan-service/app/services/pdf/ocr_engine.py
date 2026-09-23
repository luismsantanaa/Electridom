"""OCR engine — text extraction from plan images."""

from __future__ import annotations

import logging
import os
import shutil
from dataclasses import dataclass
from typing import cast

import numpy as np
from PIL import Image
from shapely import Polygon

logger = logging.getLogger(__name__)

try:
    import pytesseract
except ImportError:  # pragma: no cover - optional dependency
    pytesseract = None


@dataclass(frozen=True)
class OcrWord:
    """A single OCR word with image-pixel position."""

    text: str
    confidence: float
    cx: float
    cy: float
    left: int
    top: int
    width: int
    height: int


def _configure_tesseract_cmd() -> None:
    """Point pytesseract at the Tesseract binary when it is not on PATH."""
    if pytesseract is None:
        return
    if shutil.which("tesseract"):
        return
    candidates = [
        os.environ.get("TESSERACT_CMD", ""),
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        "/usr/bin/tesseract",
        "/usr/local/bin/tesseract",
    ]
    for candidate in candidates:
        if candidate and os.path.isfile(candidate):
            pytesseract.pytesseract.tesseract_cmd = candidate
            logger.info("Using Tesseract binary at %s", candidate)
            return


_configure_tesseract_cmd()


class OcrEngine:
    """OCR engine for text extraction from plan images.

    Uses pytesseract if available. Falls back to an empty string if Tesseract
    is not installed, which keeps the pipeline testable in CI environments.
    """

    def __init__(self, language: str = "spa+eng"):
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

    @property
    def is_available(self) -> bool:
        """Whether OCR can run in this environment."""
        return self._tesseract_available

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

    def extract_words(
        self,
        image: np.ndarray,
        *,
        min_confidence: float = 40.0,
        scale_factor: float = 2.0,
    ) -> list[OcrWord]:
        """Extract word boxes with centers in the original image pixel space.

        Upscales the image before OCR (helps thin architectural labels), then
        maps coordinates back to the original resolution.
        """
        if not self._tesseract_available:
            return []

        try:
            import cv2

            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image

            if scale_factor != 1.0:
                upscaled = cv2.resize(
                    gray,
                    None,
                    fx=scale_factor,
                    fy=scale_factor,
                    interpolation=cv2.INTER_CUBIC,
                )
            else:
                upscaled = gray

            data = pytesseract.image_to_data(
                Image.fromarray(upscaled),
                lang=self.language,
                config="--psm 11",
                output_type=pytesseract.Output.DICT,
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("OCR word extraction failed: %s", exc)
            return []

        words: list[OcrWord] = []
        n = len(data.get("text", []))
        for i in range(n):
            raw = str(data["text"][i]).strip()
            if not raw:
                continue
            try:
                conf = float(data["conf"][i])
            except (TypeError, ValueError):
                continue
            if conf < min_confidence:
                continue

            left = int(data["left"][i] / scale_factor)
            top = int(data["top"][i] / scale_factor)
            width = max(1, int(data["width"][i] / scale_factor))
            height = max(1, int(data["height"][i] / scale_factor))
            words.append(
                OcrWord(
                    text=raw,
                    confidence=conf,
                    cx=left + width / 2.0,
                    cy=top + height / 2.0,
                    left=left,
                    top=top,
                    width=width,
                    height=height,
                ),
            )

        logger.info("OCR extracted %d words (conf>=%.0f)", len(words), min_confidence)
        return words

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
