"""DXF processing Celery task.

TODO (Fase 3): Implement full DXF processing pipeline.
"""

from app.core.celery_app import celery_app


@celery_app.task(name="process_dxf", bind=True)
def process_dxf_task(self, plan_id: str) -> dict:
    """Process an uploaded DXF file to detect spaces.

    Steps:
    1. Download DXF from MinIO
    2. Parse entities with ezdxf
    3. Build polygons from line segments
    4. Calculate areas and perimeters
    5. Classify spaces
    6. Save results to database
    """
    # TODO: Implement in Fase 3
    return {
        "plan_id": plan_id,
        "status": "not_implemented",
        "message": "DXF processing will be implemented in Fase 3",
    }
