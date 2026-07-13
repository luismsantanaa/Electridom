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

        result = self._measure_and_classify(polygons, file_path, scale)

        # AI fallback: if average confidence is low, try OpenAI Vision
        avg_conf = result["metadata"]["average_confidence"]
        if avg_conf < 0.5 and pdf_type in (PdfType.RASTER, PdfType.MIXED):
            try:
                from app.services.ai.vision_classifier import analyze_with_vision

                # Render first page as image for Vision API
                image_path = self._render_pdf_page_as_image(file_path)
                if image_path:
                    logger.info(
                        "Low confidence (%.2f), trying Vision API fallback", avg_conf
                    )
                    import asyncio

                    vision_spaces = asyncio.run(
                        analyze_with_vision(
                            image_path,
                            cache_key=str(Path(file_path).stat().st_mtime),
                        )
                    )
                    if vision_spaces:
                        result["spaces"] = vision_spaces
                        result["metadata"]["ai_fallback_used"] = True
                        result["metadata"]["ai_fallback_reason"] = (
                            f"low_confidence:{avg_conf:.2f}"
                        )
                        # Recalculate metadata
                        total_area = sum(s["area_m2"] for s in vision_spaces)
                        classified = sum(
                            1
                            for s in vision_spaces
                            if s["space_type"] and s["space_type"] != "unknown"
                        )
                        confs = [s["confidence"] for s in vision_spaces]
                        result["metadata"].update(
                            {
                                "total_spaces": len(vision_spaces),
                                "total_area_m2": round(total_area, 4),
                                "classified_spaces": classified,
                                "unclassified_spaces": len(vision_spaces) - classified,
                                "average_confidence": round(
                                    sum(confs) / len(confs) if confs else 0.0, 4
                                ),
                            },
                        )
            except Exception as e:
                logger.warning("Vision API fallback failed: %s", e)
                result["metadata"]["ai_fallback_used"] = False
                result["metadata"]["ai_fallback_error"] = str(e)

        return result

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

    @staticmethod
    def _render_pdf_page_as_image(file_path: str) -> str | None:
        """Render the first page of a PDF as a PNG image for Vision API.

        Returns the path to the temporary image file, or None on failure.
        """
        try:
            import tempfile

            import pymupdf
        except ImportError:
            return None

        try:
            doc = pymupdf.open(file_path)
            page = doc[0]
            pix = page.get_pixmap(dpi=150)

            tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
            pix.save(tmp.name)
            doc.close()
            return tmp.name
        except Exception:
            return None
