"""Processing orchestrator — routes PDF/DXF plans to the correct pipeline."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from app.services.dxf.classifier import SpaceClassifier
from app.services.dxf.parser import DxfParser, detect_scale
from app.services.dxf.polygon_builder import PolygonBuilder
from app.services.geometry.measurement import SpaceMeasurement
from app.services.pdf.mixed_parser import PdfMixedParser
from app.services.pdf.ocr_engine import OcrEngine
from app.services.pdf.raster_parser import PdfRasterParser
from app.services.pdf.type_detector import PdfType, PdfTypeDetector
from app.services.pdf.vector_parser import PdfVectorParser

logger = logging.getLogger(__name__)


class ProcessingOrchestrator:
    """Routes plans to the correct processing pipeline and returns results."""

    def __init__(self) -> None:
        self.type_detector = PdfTypeDetector()
        self.ocr_engine = OcrEngine()

    def process_pdf(self, file_path: str, scale: float = 1.0) -> dict[str, Any]:
        """Process a PDF file and return detected spaces.

        Args:
            file_path: Path to the PDF file on disk.
            scale: Scale factor to convert drawing units to meters.

        Returns:
            Unified result dictionary with spaces and metadata.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"PDF file not found: {file_path}")

        pdf_type = self.type_detector.detect(file_path)
        logger.info("Detected PDF type for %s: %s", path.name, pdf_type.value)

        vector_parser = PdfVectorParser(scale=scale)
        raster_parser = PdfRasterParser(scale=scale, dpi=300)
        mixed_parser = PdfMixedParser(vector_parser, raster_parser)

        if pdf_type == PdfType.VECTORIAL:
            polygons = vector_parser.parse(file_path)
        elif pdf_type == PdfType.RASTER:
            polygons = raster_parser.parse(file_path)
        else:
            polygons = mixed_parser.parse(file_path)

        return self._measure_and_classify(polygons, file_path, scale)

    def process_dxf(self, file_path: str, scale: float = 1.0) -> dict[str, Any]:
        """Process a DXF file and return detected spaces.

        Args:
            file_path: Path to the DXF file on disk.
            scale: Optional scale override; when omitted, scale is auto-detected.

        Returns:
            Unified result dictionary with spaces and metadata.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"DXF file not found: {file_path}")

        parser = DxfParser()
        entities = parser.parse(str(path))
        detected_scale = detect_scale(entities)
        effective_scale = scale if scale != 1.0 else detected_scale

        builder = PolygonBuilder()
        polygons = builder.build_polygons(entities, scale=effective_scale)

        return self._measure_and_classify_dxf(
            polygons,
            entities.texts,
            effective_scale,
            entities,
        )

    def _measure_and_classify(
        self,
        polygons: list[Any],
        file_path: str,
        scale: float,
    ) -> dict[str, Any]:
        """Measure and classify PDF polygons, returning a unified result."""
        measurer = SpaceMeasurement()
        classifier = SpaceClassifier()
        texts = self._extract_pdf_texts(file_path)

        spaces: list[dict[str, Any]] = []
        for polygon in polygons:
            dimensions = measurer.calculate(polygon, scale=scale)
            classification = classifier.classify(polygon, texts, scale=scale)
            spaces.append(
                {
                    "name": str(classification["suggested_name"]),
                    "space_type": str(classification["space_type"]),
                    "area_m2": round(dimensions.area_m2, 4),
                    "perimeter_m": round(dimensions.perimeter_m, 4),
                    "width_m": round(dimensions.width_m, 4),
                    "length_m": round(dimensions.length_m, 4),
                    "vertices": [
                        {"x": round(x, 6), "y": round(y, 6)} for x, y in dimensions.vertices
                    ],
                    "confidence": round(float(classification["confidence"]), 4),
                    "classification_method": str(classification["method"]),
                },
            )

        return self._build_result("pdf", spaces, scale)

    def _measure_and_classify_dxf(
        self,
        polygons: list[Any],
        texts: list[Any],
        scale: float,
        entities: Any,
    ) -> dict[str, Any]:
        """Measure and classify DXF polygons, returning a unified result."""
        measurer = SpaceMeasurement()
        classifier = SpaceClassifier()

        spaces: list[dict[str, Any]] = []
        for polygon in polygons:
            dimensions = measurer.calculate(polygon, scale=scale)
            classification = classifier.classify(polygon, texts, scale=scale)
            spaces.append(
                {
                    "name": str(classification["suggested_name"]),
                    "space_type": str(classification["space_type"]),
                    "area_m2": round(dimensions.area_m2, 4),
                    "perimeter_m": round(dimensions.perimeter_m, 4),
                    "width_m": round(dimensions.width_m, 4),
                    "length_m": round(dimensions.length_m, 4),
                    "vertices": [
                        {"x": round(x, 6), "y": round(y, 6)} for x, y in dimensions.vertices
                    ],
                    "confidence": round(float(classification["confidence"]), 4),
                    "classification_method": str(classification["method"]),
                },
            )

        result = self._build_result("dxf", spaces, scale)
        result["metadata"].update(
            {
                "dxf_version": entities.metadata.dxf_version,
                "units": entities.metadata.units,
                "extents_min": entities.metadata.extents_min,
                "extents_max": entities.metadata.extents_max,
            },
        )
        return result

    @staticmethod
    def _build_result(
        file_type: str,
        spaces: list[dict[str, Any]],
        scale: float,
    ) -> dict[str, Any]:
        """Build a unified result dictionary."""
        total_area = sum(space["area_m2"] for space in spaces)
        classified = sum(
            1 for space in spaces if space["space_type"] and space["space_type"] != "otro"
        )
        confidences = [space["confidence"] for space in spaces]
        average_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        return {
            "file_type": file_type,
            "scale": scale,
            "spaces": spaces,
            "metadata": {
                "total_spaces": len(spaces),
                "total_area_m2": round(total_area, 4),
                "classified_spaces": classified,
                "unclassified_spaces": len(spaces) - classified,
                "average_confidence": round(average_confidence, 4),
            },
        }

    def _extract_pdf_texts(self, file_path: str) -> list[Any]:
        """Extract text entities from a PDF for classification."""
        try:
            import pymupdf
        except ImportError:  # pragma: no cover - fallback import
            import fitz as pymupdf  # type: ignore[no-redef]

        from app.services.dxf.parser import TextEntity

        texts: list[TextEntity] = []
        doc = pymupdf.open(file_path)
        try:
            for page in doc:
                for block in page.get_text("blocks"):
                    if len(block) < 5:
                        continue
                    content = block[4]
                    if not isinstance(content, str) or not content.strip():
                        continue
                    texts.append(
                        TextEntity(
                            content=content.strip(),
                            position=(
                                float((block[0] + block[2]) / 2.0),
                                float((block[1] + block[3]) / 2.0),
                            ),
                            text_type="PDF_TEXT",
                        ),
                    )
        finally:
            doc.close()

        return texts
