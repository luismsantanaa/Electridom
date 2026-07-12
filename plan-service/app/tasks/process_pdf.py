"""PDF processing Celery task.

TODO (Fase 4): Implement full PDF processing pipeline.
"""

from app.core.celery_app import celery_app


@celery_app.task(name="process_pdf", bind=True)
def process_pdf_task(self, plan_id: str) -> dict:
    """Process an uploaded PDF file to detect spaces.

    Steps:
    1. Download PDF from MinIO
    2. Detect PDF type (vectorial, raster, mixed)
    3. Route to appropriate pipeline
    4. Extract polygons
    5. Calculate areas and perimeters
    6. Classify spaces
    7. Save results to database
    """
    # TODO: Implement in Fase 4
    return {
        "plan_id": plan_id,
        "status": "not_implemented",
        "message": "PDF processing will be implemented in Fase 4",
    }
