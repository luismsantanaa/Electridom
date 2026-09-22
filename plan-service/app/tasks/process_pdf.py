"""PDF/PNG/JPG/WEBP/TIFF processing Celery task."""

from __future__ import annotations

import asyncio
import logging
import os
import tempfile
import uuid
from pathlib import Path
from typing import Any

from sqlalchemy import delete, select

from app.core.celery_app import celery_app
from app.core.database import task_session_factory as async_session_factory
from app.core.storage import storage
from app.models.detected_space import DetectedSpace
from app.models.plan import Plan
from app.services.processing.orchestrator import ProcessingOrchestrator

logger = logging.getLogger(__name__)

IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "tiff"}


@celery_app.task(name="process_pdf", bind=True)  # type: ignore[untyped-decorator]
def process_pdf_task(self: Any, plan_id: str) -> dict[str, Any]:
    """Process an uploaded PDF or PNG plan file to detect spaces."""
    return asyncio.run(_process_pdf_async(plan_id))


async def _process_pdf_async(plan_id: str) -> dict[str, Any]:
    """Async implementation of the PDF/PNG processing pipeline."""
    plan_uuid = uuid.UUID(plan_id)
    temp_path: Path | None = None

    try:
        async with async_session_factory() as session:
            result = await session.execute(select(Plan).where(Plan.id == plan_uuid))
            plan = result.scalar_one_or_none()

            if not plan:
                logger.error("Plan %s not found for PDF/PNG processing", plan_id)
                return {
                    "plan_id": plan_id,
                    "status": "failed",
                    "error": "Plan not found",
                }

            plan.processing_status = "processing"
            plan.processing_error = None
            await session.flush()

            file_data = storage.download_file(plan.storage_key)
            suffix = Path(plan.original_filename).suffix or (
                f".{plan.file_type}" if plan.file_type in IMAGE_EXTENSIONS else ".pdf"
            )
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(file_data)
                temp_path = Path(tmp.name)

            logger.info(
                "Downloaded %s for plan %s to %s",
                plan.file_type.upper(),
                plan_id,
                temp_path,
            )

            orchestrator = ProcessingOrchestrator()
            if plan.file_type in IMAGE_EXTENSIONS:
                processing_result = orchestrator.process_image(str(temp_path))
            else:
                processing_result = orchestrator.process_pdf(str(temp_path))

            # Replace previous spaces so reprocessing does not duplicate rows.
            await session.execute(
                delete(DetectedSpace).where(DetectedSpace.plan_id == plan_uuid),
            )

            detected_spaces: list[DetectedSpace] = []
            for space_data in processing_result.get("spaces", []):
                space_type = space_data.get("space_type")
                if space_type == "descartado":
                    continue
                detected_spaces.append(
                    DetectedSpace(
                        id=uuid.uuid4(),
                        plan_id=plan_uuid,
                        name=space_data.get("name"),
                        space_type=space_type,
                        area_m2=space_data.get("area_m2"),
                        perimeter_m=space_data.get("perimeter_m"),
                        vertices=space_data.get("vertices") or [],
                        confidence=space_data.get("confidence"),
                        classification_method=space_data.get("classification_method"),
                        is_verified=False,
                    ),
                )

            session.add_all(detected_spaces)

            metadata = dict(processing_result.get("metadata") or {})
            # Keep DB statistics aligned with persisted rows.
            metadata["total_spaces"] = len(detected_spaces)
            metadata["total_area_m2"] = round(
                sum(s.area_m2 or 0.0 for s in detected_spaces),
                4,
            )

            plan.processing_status = "completed"
            plan.processing_result = {
                "metadata": metadata,
                "scale": processing_result.get("scale"),
                "statistics": {
                    "total_spaces": len(detected_spaces),
                    "total_area_m2": metadata["total_area_m2"],
                    "classified_spaces": metadata.get("classified_spaces"),
                    "unclassified_spaces": metadata.get("unclassified_spaces"),
                    "average_confidence": metadata.get("average_confidence"),
                },
            }
            plan.processing_error = None
            await session.commit()

            logger.info(
                "Processed %s for plan %s: %d spaces detected",
                plan.file_type.upper(),
                plan_id,
                len(detected_spaces),
            )

            return {
                "plan_id": plan_id,
                "status": "completed",
                "spaces_detected": len(detected_spaces),
                "statistics": plan.processing_result["statistics"],
            }

    except Exception as exc:  # noqa: BLE001
        logger.exception("PDF processing failed for plan %s: %s", plan_id, exc)
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
                    "Could not remove temporary PDF file %s: %s",
                    temp_path,
                    cleanup_exc,
                )
