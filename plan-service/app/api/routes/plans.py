"""Plan endpoints — upload, list, detail, delete."""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, get_storage
from app.core.config import settings
from app.core.storage import StorageService
from app.models.plan import Plan
from app.schemas.plan import PlanDetail, PlanListItem, PlanListResponse, PlanUploadResponse
from app.schemas.processing import ProcessingStatusResponse

router = APIRouter(prefix="/api/plans", tags=["plans"])

ALLOWED_EXTENSIONS = {".pdf", ".dxf"}
MAX_FILE_SIZE = settings.max_file_size_mb * 1024 * 1024  # Convert MB to bytes


def _validate_file(filename: str, content_length: int) -> tuple[str, str]:
    """Validate uploaded file extension and size. Returns (file_type, extension)."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    if content_length > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {settings.max_file_size_mb}MB",
        )
    file_type = ext[1:]  # Remove the dot
    return file_type, ext


@router.post("/upload", response_model=PlanUploadResponse, status_code=201)
async def upload_plan(
    file: UploadFile,
    project_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    storage_service: StorageService = Depends(get_storage),
) -> PlanUploadResponse:
    """Upload a PDF or DXF plan file for processing.

    The file is stored in MinIO and a Celery task is queued for processing.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is required")

    # Read file content
    content = await file.read()
    content_length = len(content)

    # Validate
    file_type, ext = _validate_file(file.filename, content_length)

    # Generate storage key
    plan_id = uuid.uuid4()
    storage_key = f"plans/{plan_id}/{file.filename}"

    # Upload to MinIO
    content_type = "application/pdf" if file_type == "pdf" else "application/dxf"
    storage_service.upload_file(storage_key, content, content_type)

    # Create plan record in database
    plan = Plan(
        id=plan_id,
        project_id=project_id,
        file_type=file_type,
        storage_key=storage_key,
        original_filename=file.filename,
        processing_status="pending",
    )
    db.add(plan)
    await db.flush()

    # TODO (Fase 3): Queue Celery task for processing
    # from app.tasks.process_dxf import process_dxf_task
    # from app.tasks.process_pdf import process_pdf_task
    # if file_type == "dxf":
    #     task = process_dxf_task.delay(str(plan_id))
    # else:
    #     task = process_pdf_task.delay(str(plan_id))

    return PlanUploadResponse(
        plan_id=plan.id,
        storage_key=storage_key,
        original_filename=file.filename,
        file_type=file_type,
        processing_status="pending",
    )


@router.get("", response_model=PlanListResponse)
async def list_plans(
    page: int = 1,
    page_size: int = 20,
    project_id: uuid.UUID | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> PlanListResponse:
    """List plans with pagination and optional filters."""
    query = select(Plan)

    if project_id:
        query = query.where(Plan.project_id == project_id)
    if status:
        query = query.where(Plan.processing_status == status)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    query = query.order_by(Plan.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    plans = result.scalars().all()

    items = [
        PlanListItem(
            id=plan.id,
            project_id=plan.project_id,
            file_type=plan.file_type,
            original_filename=plan.original_filename,
            processing_status=plan.processing_status,
            space_count=len(plan.detected_spaces) if plan.detected_spaces else 0,
            created_at=plan.created_at,
        )
        for plan in plans
    ]

    return PlanListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{plan_id}", response_model=PlanDetail)
async def get_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> PlanDetail:
    """Get detailed information about a specific plan."""
    query = (
        select(Plan)
        .options(selectinload(Plan.detected_spaces))
        .where(Plan.id == plan_id)
    )
    result = await db.execute(query)
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    return PlanDetail(
        id=plan.id,
        project_id=plan.project_id,
        file_type=plan.file_type,
        storage_key=plan.storage_key,
        original_filename=plan.original_filename,
        processing_status=plan.processing_status,
        processing_error=plan.processing_error,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        space_count=len(plan.detected_spaces) if plan.detected_spaces else 0,
    )


@router.get("/{plan_id}/status", response_model=ProcessingStatusResponse)
async def get_plan_status(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ProcessingStatusResponse:
    """Get the current processing status of a plan."""
    query = (
        select(Plan)
        .options(selectinload(Plan.detected_spaces))
        .where(Plan.id == plan_id)
    )
    result = await db.execute(query)
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    return ProcessingStatusResponse(
        plan_id=plan.id,
        processing_status=plan.processing_status,
        error_message=plan.processing_error,
        spaces_detected=len(plan.detected_spaces) if plan.detected_spaces else None,
    )


@router.get("/{plan_id}/result")
async def get_plan_result(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get the processing result (detected spaces) for a plan."""
    query = (
        select(Plan)
        .options(selectinload(Plan.detected_spaces))
        .where(Plan.id == plan_id)
    )
    result = await db.execute(query)
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    if plan.processing_status != "completed":
        return {
            "plan_id": str(plan.id),
            "processing_status": plan.processing_status,
            "message": "Plan processing not yet completed.",
            "spaces": [],
        }

    spaces = [
        {
            "id": str(space.id),
            "name": space.name,
            "space_type": space.space_type,
            "area_m2": space.area_m2,
            "perimeter_m": space.perimeter_m,
            "vertices": space.vertices,
            "confidence": space.confidence,
            "classification_method": space.classification_method,
            "is_verified": space.is_verified,
        }
        for space in (plan.detected_spaces or [])
    ]

    return {
        "plan_id": str(plan.id),
        "file_type": plan.file_type,
        "processing_status": plan.processing_status,
        "spaces": spaces,
        "statistics": {
            "total_spaces": len(spaces),
            "total_area_m2": sum(s.get("area_m2", 0) or 0 for s in spaces),
            "classified_spaces": sum(1 for s in spaces if s.get("space_type")),
            "unclassified_spaces": sum(1 for s in spaces if not s.get("space_type")),
            "average_confidence": (
                sum(s.get("confidence", 0) or 0 for s in spaces) / len(spaces)
                if spaces
                else 0
            ),
        },
    }


@router.delete("/{plan_id}", status_code=204)
async def delete_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    storage_service: StorageService = Depends(get_storage),
) -> None:
    """Delete a plan and its associated file from storage."""
    query = select(Plan).where(Plan.id == plan_id)
    result = await db.execute(query)
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Delete file from MinIO
    try:
        storage_service.delete_file(plan.storage_key)
    except Exception:
        pass  # File might already be deleted

    # Delete from database (cascades to detected_spaces)
    await db.delete(plan)
