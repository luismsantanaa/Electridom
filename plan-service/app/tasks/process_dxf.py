"""DXF processing Celery task."""

from __future__ import annotations

import asyncio
import logging
import os
import tempfile
import uuid
from pathlib import Path
from typing import Any, cast

from sqlalchemy import delete, select

from app.core.celery_app import celery_app
from app.core.database import async_session_factory
from app.core.storage import storage
from app.models.detected_space import DetectedSpace
from app.models.plan import Plan
from app.services.dxf.classifier import SpaceClassifier
from app.services.dxf.parser import DxfEntities, DxfParser, detect_scale
from app.services.dxf.polygon_builder import PolygonBuilder
from app.services.geometry.measurement import SpaceMeasurement

logger = logging.getLogger(__name__)


@celery_app.task(name="process_dxf", bind=True)  # type: ignore[untyped-decorator]
def process_dxf_task(self: Any, plan_id: str) -> dict[str, Any]:
    """Process an uploaded DXF file to detect spaces."""
    return asyncio.run(_process_dxf_async(plan_id))


async def _process_dxf_async(plan_id: str) -> dict[str, Any]:
    """Async implementation of the DXF processing pipeline."""
    plan_uuid = uuid.UUID(plan_id)
    temp_path: Path | None = None

    try:
        async with async_session_factory() as session:
            # Load plan and mark as processing.
            result = await session.execute(select(Plan).where(Plan.id == plan_uuid))
            plan = result.scalar_one_or_none()

            if not plan:
                logger.error("Plan %s not found for DXF processing", plan_id)
                return {
                    "plan_id": plan_id,
                    "status": "failed",
                    "error": "Plan not found",
                }

            plan.processing_status = "processing"
            plan.processing_error = None
            await session.flush()

            # Download file from MinIO.
            file_data = storage.download_file(plan.storage_key)
            suffix = Path(plan.original_filename).suffix or ".dxf"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(file_data)
                temp_path = Path(tmp.name)

            logger.info("Downloaded DXF for plan %s to %s", plan_id, temp_path)

            # Parse DXF entities.
            parser = DxfParser()
            entities: DxfEntities = parser.parse(str(temp_path))

            # Detect drawing scale.
            scale = detect_scale(entities)
            logger.info("Detected scale for plan %s: %s", plan_id, scale)

            # Build closed polygons.
            builder = PolygonBuilder()
            polygons = builder.build_polygons(entities, scale=scale)
            logger.info("Built %d polygons for plan %s", len(polygons), plan_id)

            # Clear previous detected spaces for this plan.
            await session.execute(
                delete(DetectedSpace).where(DetectedSpace.plan_id == plan_uuid),
            )

            # Measure and classify each polygon.
            measurer = SpaceMeasurement()
            classifier = SpaceClassifier()
            detected_spaces: list[DetectedSpace] = []

            for idx, polygon in enumerate(polygons, start=1):
                dimensions = measurer.calculate(polygon, scale=scale)
                classification = classifier.classify(polygon, entities.texts, scale=scale)

                space = DetectedSpace(
                    id=uuid.uuid4(),
                    plan_id=plan_uuid,
                    name=str(classification["suggested_name"]),
                    space_type=str(classification["space_type"]),
                    area_m2=round(dimensions.area_m2, 4),
                    perimeter_m=round(dimensions.perimeter_m, 4),
                    vertices=[{"x": round(x, 6), "y": round(y, 6)} for x, y in dimensions.vertices],
                    confidence=round(cast(float, classification["confidence"]), 4),
                    classification_method=str(classification["method"]),
                    is_verified=False,
                )
                detected_spaces.append(space)

            session.add_all(detected_spaces)

            # Compute statistics.
            total_area = sum(space.area_m2 or 0.0 for space in detected_spaces)
            classified = sum(
                1 for space in detected_spaces if space.space_type and space.space_type != "otro"
            )
            confidences = [
                space.confidence for space in detected_spaces if space.confidence is not None
            ]
            average_confidence = sum(confidences) / len(confidences) if confidences else 0.0

            statistics = {
                "total_spaces": len(detected_spaces),
                "total_area_m2": round(total_area, 4),
                "classified_spaces": classified,
                "unclassified_spaces": len(detected_spaces) - classified,
                "average_confidence": round(average_confidence, 4),
            }

            plan.processing_status = "completed"
            plan.processing_result = {
                "metadata": {
                    "dxf_version": entities.metadata.dxf_version,
                    "units": entities.metadata.units,
                    "scale": scale,
                    "extents_min": entities.metadata.extents_min,
                    "extents_max": entities.metadata.extents_max,
                },
                "statistics": statistics,
            }
            plan.processing_error = None

            await session.commit()

            logger.info(
                "Completed DXF processing for plan %s: %d spaces detected",
                plan_id,
                len(detected_spaces),
            )

            return {
                "plan_id": plan_id,
                "status": "completed",
                "spaces_detected": len(detected_spaces),
                "statistics": statistics,
            }

    except Exception as exc:  # noqa: BLE001
        logger.exception("DXF processing failed for plan %s: %s", plan_id, exc)
        try:
            async with async_session_factory() as session:
                result = await session.execute(select(Plan).where(Plan.id == plan_uuid))
                plan = result.scalar_one_or_none()
                if plan:
                    plan.processing_status = "failed"
                    plan.processing_error = str(exc)
                    await session.commit()
        except Exception as cleanup_exc:  # noqa: BLE001
            logger.exception(
                "Failed to update plan %s status after error: %s",
                plan_id,
                cleanup_exc,
            )

        return {
            "plan_id": plan_id,
            "status": "failed",
            "error": str(exc),
        }

    finally:
        if temp_path and temp_path.exists():
            try:
                os.remove(temp_path)
            except OSError as cleanup_exc:
                logger.warning(
                    "Could not remove temporary DXF file %s: %s",
                    temp_path,
                    cleanup_exc,
                )
