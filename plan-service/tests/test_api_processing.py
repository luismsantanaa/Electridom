"""Tests for processing API endpoints."""

import uuid

import pytest

from tests.conftest import make_plan, scalar_result


@pytest.mark.usefixtures("override_deps")
def test_process_plan_success(client, mock_db, patch_process_tasks):
    """Triggering processing should reset status and queue a Celery task."""
    plan = make_plan(file_type="dxf", status="failed")
    mock_db.execute.return_value = scalar_result(plan)

    response = client.post(f"/api/plans/{plan.id}/process")

    assert response.status_code == 200
    data = response.json()
    assert data["plan_id"] == str(plan.id)
    assert data["processing_status"] == "pending"
    assert data["celery_task_id"] == "celery-task-id"
    assert plan.processing_error is None
    assert plan.processing_result == {"celery_task_id": "celery-task-id"}
    patch_process_tasks["dxf_proc"].delay.assert_called_once_with(str(plan.id))


@pytest.mark.usefixtures("override_deps")
def test_process_plan_already_processing(client, mock_db):
    """Triggering processing while already processing should return 409."""
    plan = make_plan(status="processing")
    mock_db.execute.return_value = scalar_result(plan)

    response = client.post(f"/api/plans/{plan.id}/process")

    assert response.status_code == 409
    assert "already being processed" in response.json()["detail"]


@pytest.mark.usefixtures("override_deps")
def test_process_plan_not_found(client, mock_db):
    """Triggering processing for a missing plan should return 404."""
    mock_db.execute.return_value = scalar_result(None)

    response = client.post(f"/api/plans/{uuid.uuid4()}/process")

    assert response.status_code == 404
    assert response.json()["detail"] == "Plan not found"
