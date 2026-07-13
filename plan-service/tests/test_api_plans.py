"""Tests for plan API endpoints."""

import uuid
from io import BytesIO

import pytest

from tests.conftest import (
    count_result,
    fetch_result,
    make_plan,
    make_space,
    scalar_result,
)


@pytest.mark.usefixtures("override_deps")
def test_upload_plan_success(client, mock_storage, patch_process_tasks):
    """Uploading a valid DXF file should store it and queue processing."""
    mock_storage.upload_file.return_value = "plans/uuid/test.dxf"

    response = client.post(
        "/api/plans/upload",
        files={"file": ("test.dxf", BytesIO(b"dxf content"), "application/dxf")},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["file_type"] == "dxf"
    assert data["original_filename"] == "test.dxf"
    assert data["processing_status"] == "pending"
    assert data["plan_id"] == str(uuid.UUID(data["plan_id"]))

    assert mock_storage.upload_file.called
    args = mock_storage.upload_file.call_args.args
    assert args[0].startswith("plans/")
    assert args[0].endswith("/test.dxf")
    assert args[1] == b"dxf content"

    patch_process_tasks["dxf"].delay.assert_called_once_with(data["plan_id"])


@pytest.mark.usefixtures("override_deps")
def test_upload_plan_invalid_extension(client):
    """Uploading a file with an unsupported extension should return 400."""
    response = client.post(
        "/api/plans/upload",
        files={"file": ("test.txt", BytesIO(b"text content"), "text/plain")},
    )

    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]


@pytest.mark.usefixtures("override_deps")
def test_upload_plan_file_too_large(client, monkeypatch):
    """Uploading a file larger than the limit should return 413."""
    monkeypatch.setattr("app.api.routes.plans.MAX_FILE_SIZE", 10)

    response = client.post(
        "/api/plans/upload",
        files={"file": ("test.dxf", BytesIO(b"x" * 11), "application/dxf")},
    )

    assert response.status_code == 413
    assert "File too large" in response.json()["detail"]


@pytest.mark.usefixtures("override_deps")
def test_list_plans_empty(client, mock_db):
    """Listing plans with no results should return an empty paginated list."""
    mock_db.execute.side_effect = [count_result(0), fetch_result([])]

    response = client.get("/api/plans")

    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["page"] == 1
    assert data["page_size"] == 20


@pytest.mark.usefixtures("override_deps")
def test_list_plans_with_pagination(client, mock_db):
    """Pagination parameters should be reflected in the response."""
    plan = make_plan(file_type="pdf")
    mock_db.execute.side_effect = [count_result(2), fetch_result([plan])]

    response = client.get("/api/plans?page=1&page_size=1")

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["total"] == 2
    assert data["page_size"] == 1


@pytest.mark.usefixtures("override_deps")
def test_list_plans_filter_by_project(client, mock_db):
    """Filtering by project_id should not raise an error."""
    project_id = uuid.uuid4()
    plan = make_plan()
    mock_db.execute.side_effect = [count_result(1), fetch_result([plan])]

    response = client.get(f"/api/plans?project_id={project_id}")

    assert response.status_code == 200
    assert response.json()["total"] == 1


@pytest.mark.usefixtures("override_deps")
def test_get_plan_success(client, mock_db):
    """Fetching an existing plan should return its details."""
    plan = make_plan()
    mock_db.execute.return_value = scalar_result(plan)

    response = client.get(f"/api/plans/{plan.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(plan.id)
    assert data["file_type"] == plan.file_type
    assert data["space_count"] == 0


@pytest.mark.usefixtures("override_deps")
def test_get_plan_not_found(client, mock_db):
    """Fetching a non-existent plan should return 404."""
    mock_db.execute.return_value = scalar_result(None)

    response = client.get(f"/api/plans/{uuid.uuid4()}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Plan not found"


@pytest.mark.usefixtures("override_deps")
def test_get_plan_status_pending(client, mock_db):
    """Status endpoint should reflect a pending plan."""
    plan = make_plan(status="pending")
    mock_db.execute.return_value = scalar_result(plan)

    response = client.get(f"/api/plans/{plan.id}/status")

    assert response.status_code == 200
    data = response.json()
    assert data["processing_status"] == "pending"
    assert data["spaces_detected"] is None


@pytest.mark.usefixtures("override_deps")
def test_get_plan_status_completed(client, mock_db):
    """Status endpoint should report detected spaces for completed plans."""
    space = make_space()
    plan = make_plan(status="completed", detected_spaces=[space])
    mock_db.execute.return_value = scalar_result(plan)

    response = client.get(f"/api/plans/{plan.id}/status")

    assert response.status_code == 200
    data = response.json()
    assert data["processing_status"] == "completed"
    assert data["spaces_detected"] == 1


@pytest.mark.usefixtures("override_deps")
def test_get_plan_result_not_completed(client, mock_db):
    """Result endpoint should indicate processing is incomplete."""
    plan = make_plan(status="processing")
    mock_db.execute.return_value = scalar_result(plan)

    response = client.get(f"/api/plans/{plan.id}/result")

    assert response.status_code == 200
    data = response.json()
    assert data["processing_status"] == "processing"
    assert data["message"] == "Plan processing not yet completed."
    assert data["spaces"] == []


@pytest.mark.usefixtures("override_deps")
def test_get_plan_result_completed(client, mock_db):
    """Result endpoint should return spaces and statistics when completed."""
    space = make_space(area_m2=12.0, confidence=0.8)
    plan = make_plan(status="completed", detected_spaces=[space])
    mock_db.execute.return_value = scalar_result(plan)

    response = client.get(f"/api/plans/{plan.id}/result")

    assert response.status_code == 200
    data = response.json()
    assert data["processing_status"] == "completed"
    assert len(data["spaces"]) == 1
    assert data["statistics"]["total_spaces"] == 1
    assert data["statistics"]["total_area_m2"] == 12.0


@pytest.mark.usefixtures("override_deps")
def test_delete_plan_success(client, mock_db, mock_storage):
    """Deleting a plan should remove the file and database record."""
    plan = make_plan()
    mock_db.execute.return_value = scalar_result(plan)

    response = client.delete(f"/api/plans/{plan.id}")

    assert response.status_code == 204
    mock_storage.delete_file.assert_called_once_with(plan.storage_key)
    mock_db.delete.assert_called_once_with(plan)


@pytest.mark.usefixtures("override_deps")
def test_delete_plan_not_found(client, mock_db):
    """Deleting a non-existent plan should return 404."""
    mock_db.execute.return_value = scalar_result(None)

    response = client.delete(f"/api/plans/{uuid.uuid4()}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Plan not found"


@pytest.mark.usefixtures("override_deps")
def test_patch_space_success(client, mock_db):
    """Updating a detected space should persist allowed fields."""
    space = make_space(name="Old Room")
    plan = make_plan(detected_spaces=[space])
    mock_db.execute.return_value = scalar_result(plan)

    response = client.patch(
        f"/api/plans/{plan.id}/spaces/{space.id}",
        json={"name": "Kitchen", "space_type": "kitchen", "is_verified": True},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Kitchen"
    assert data["space_type"] == "kitchen"
    assert data["is_verified"] is True


@pytest.mark.usefixtures("override_deps")
def test_patch_space_resets_verification_on_vertices_change(client, mock_db):
    """Updating vertices should reset the verified flag."""
    space = make_space(is_verified=True)
    plan = make_plan(detected_spaces=[space])
    mock_db.execute.return_value = scalar_result(plan)

    response = client.patch(
        f"/api/plans/{plan.id}/spaces/{space.id}",
        json={"vertices": [{"x": 0.0, "y": 0.0}, {"x": 3.0, "y": 0.0}]},
    )

    assert response.status_code == 200
    assert response.json()["is_verified"] is False


@pytest.mark.usefixtures("override_deps")
def test_patch_space_not_found(client, mock_db):
    """Updating a space that does not belong to the plan should return 404."""
    space = make_space()
    other_space = make_space()
    plan = make_plan(detected_spaces=[space])
    mock_db.execute.return_value = scalar_result(plan)

    response = client.patch(
        f"/api/plans/{plan.id}/spaces/{other_space.id}",
        json={"name": "Kitchen"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Space not found"


@pytest.mark.usefixtures("override_deps")
def test_download_plan_success(client, mock_db, mock_storage):
    """Downloading a plan should stream the file from storage."""
    plan = make_plan(file_type="pdf", original_filename="floor.pdf")
    mock_db.execute.return_value = scalar_result(plan)
    mock_storage.download_file.return_value = b"pdf bytes"

    response = client.get(f"/api/plans/{plan.id}/download")

    assert response.status_code == 200
    assert response.content == b"pdf bytes"
    assert response.headers["content-type"] == "application/pdf"
    assert "floor.pdf" in response.headers["content-disposition"]
    mock_storage.download_file.assert_called_once_with(plan.storage_key)


@pytest.mark.usefixtures("override_deps")
def test_download_plan_not_found(client, mock_db):
    """Downloading a non-existent plan should return 404."""
    mock_db.execute.return_value = scalar_result(None)

    response = client.get(f"/api/plans/{uuid.uuid4()}/download")

    assert response.status_code == 404
    assert response.json()["detail"] == "Plan not found"
