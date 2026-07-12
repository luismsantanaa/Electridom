"""Celery application configuration for async task processing."""

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "plan_service",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    # Timezone
    timezone="America/Santo_Domingo",
    enable_utc=True,
    # Task execution
    task_track_started=True,
    task_time_limit=settings.processing_timeout_seconds,
    task_soft_time_limit=settings.processing_timeout_seconds - 10,
    # Worker
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
    # Result expiration (24 hours)
    result_expires=86400,
)

# Auto-discover tasks in the tasks module
celery_app.autodiscover_tasks(["app.tasks"])
