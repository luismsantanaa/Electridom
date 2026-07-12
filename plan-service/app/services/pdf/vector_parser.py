"""PDF vector parser — extracts vectorial paths from PDF using PyMuPDF.

TODO (Fase 4): Implement vector path extraction and Bézier linearization.
"""


class PdfVectorParser:
    """Parses vectorial PDFs (exported from AutoCAD/Revit)."""

    def parse(self, file_path: str) -> list:
        """Extract polygons from a vectorial PDF.

        Algorithm:
        1. PyMuPDF: page.get_drawings() → extract vector paths
        2. Convert Bézier curves → line segments
        3. Filter: remove text, images, annotations
        4. Reuse PolygonBuilder from DXF pipeline
        """
        raise NotImplementedError("PDF vector parser will be implemented in Fase 4")
