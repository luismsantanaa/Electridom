"""Processing endpoints — trigger and monitor plan processing."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db
from app.models.plan import Plan
from app.schemas.processing import ProcessingStatusResponse
from app.tasks.process_dxf import process_dxf_task
from app.tasks.process_pdf import process_pdf_task

router = APIRouter(prefix="/api/plans", tags=["processing"])


@router.post("/{plan_id}/process", response_model=ProcessingStatusResponse)
async def process_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ProcessingStatusResponse:
    """Manually trigger reprocessing of a plan file."""
    result = await db.execute(
        select(Plan)
        .options(selectinload(Plan.detected_spaces))
        .where(Plan.id == plan_id),
    )
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    if plan.processing_status == "processing":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Plan is already being processed",
        )

    plan.processing_status = "pending"
    plan.processing_error = None

    task = (
        process_dxf_task.delay(str(plan_id))
        if plan.file_type == "dxf"
        else process_pdf_task.delay(str(plan_id))
    )

    plan.processing_result = {"celery_task_id": task.id}
    await db.flush()

    return ProcessingStatusResponse(
        plan_id=plan.id,
        processing_status=plan.processing_status,
        celery_task_id=task.id,
        error_message=None,
        spaces_detected=len(plan.detected_spaces) if plan.detected_spaces else None,
    )
