"""PDF raster parser — processes scanned PDFs using OpenCV.

TODO (Fase 4): Implement contour detection + OCR for raster PDFs.
"""


class PdfRasterParser:
    """Parses raster PDFs (scanned images) using computer vision."""

    def parse(self, file_path: str) -> list:
        """Extract polygons from a raster PDF.

        Algorithm:
        1. pdf2image: convert pages to PNG (300 DPI)
        2. OpenCV: preprocessing (grayscale, threshold, denoise)
        3. OpenCV: contour detection (findContours)
        4. OpenCV: line detection (HoughLinesP)
        5. Shapely: convert contours → polygons
        6. Filter: remove noise, small contours
        """
        raise NotImplementedError("PDF raster parser will be implemented in Fase 4")
