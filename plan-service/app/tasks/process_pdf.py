"""PDF processing Celery task."""

from __future__ import annotations

import asyncio
import logging
import os
import tempfile
import uuid
from pathlib import Path
from typing import Any

from sqlalchemy import select

from app.core.celery_app import celery_app
from app.core.database import async_session_factory
from app.core.storage import storage
from app.models.plan import Plan
from app.services.processing.orchestrator import ProcessingOrchestrator

logger = logging.getLogger(__name__)


@celery_app.task(name="process_pdf", bind=True)  # type: ignore[untyped-decorator]
def process_pdf_task(self: Any, plan_id: str) -> dict[str, Any]:
    """Process an uploaded PDF file to detect spaces."""
    return asyncio.run(_process_pdf_async(plan_id))


async def _process_pdf_async(plan_id: str) -> dict[str, Any]:
    """Async implementation of the PDF processing pipeline."""
    plan_uuid = uuid.UUID(plan_id)
    temp_path: Path | None = None

    try:
        async with async_session_factory() as session:
            result = await session.execute(select(Plan).where(Plan.id == plan_uuid))
            plan = result.scalar_one_or_none()

            if not plan:
                logger.error("Plan %s not found for PDF processing", plan_id)
                return {
                    "plan_id": plan_id,
                    "status": "failed",
                    "error": "Plan not found",
                }

            plan.processing_status = "processing"
            plan.processing_error = None
            await session.flush()

            file_data = storage.download_file(plan.storage_key)
            suffix = Path(plan.original_filename).suffix or ".pdf"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(file_data)
                temp_path = Path(tmp.name)

            logger.info("Downloaded PDF for plan %s to %s", plan_id, temp_path)

            orchestrator = ProcessingOrchestrator()
            processing_result = orchestrator.process_pdf(str(temp_path))

            logger.info(
                "Processed PDF for plan %s: %d spaces detected",
                plan_id,
                processing_result["metadata"]["total_spaces"],
            )

            plan.processing_status = "completed"
            plan.processing_result = {
                "metadata": processing_result["metadata"],
                "scale": processing_result["scale"],
            }
            plan.processing_error = None
            await session.commit()

            return {
                "plan_id": plan_id,
                "status": "completed",
                "spaces_detected": processing_result["metadata"]["total_spaces"],
                "statistics": processing_result["metadata"],
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
