"""OCR engine — text extraction from plan images.

TODO (Fase 4): Implement OCR using Tesseract or EasyOCR.
"""


class OcrEngine:
    """Extracts text from plan images for space classification."""

    def extract_text(self, image, region=None) -> str:
        """Extract text from an image or image region.

        Uses Tesseract with Spanish language support.
        """
        raise NotImplementedError("OCR engine will be implemented in Fase 4")
