"""Tests for the health check endpoint."""

from unittest.mock import AsyncMock, patch

import pytest


@pytest.fixture
def healthy_redis():
    """Patch Redis as healthy for the duration of a test."""
    redis_mock = AsyncMock()
    redis_mock.ping.return_value = True
    redis_mock.close.return_value = None
    with patch("app.api.routes.health.Redis") as mock_redis:
        mock_redis.from_url.return_value = redis_mock
        yield mock_redis


@pytest.mark.usefixtures("override_deps", "healthy_redis")
def test_health_all_ok(client, mock_db, mock_storage):
    """Health endpoint should report ok when all dependencies are reachable."""
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["checks"]["database"] == "ok"
    assert data["checks"]["minio"] == "ok"
    assert data["checks"]["redis"] == "ok"


@pytest.mark.usefixtures("override_deps", "healthy_redis")
def test_health_db_down(client, mock_db, mock_storage):
    """Health endpoint should report degraded when the database is down."""
    mock_db.execute.side_effect = Exception("database connection refused")

    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert "error" in data["checks"]["database"]
    assert data["checks"]["minio"] == "ok"
    assert data["checks"]["redis"] == "ok"


@pytest.mark.usefixtures("override_deps", "healthy_redis")
def test_health_minio_down(client, mock_db, mock_storage):
    """Health endpoint should report degraded when MinIO is down."""
    mock_storage.ensure_bucket.side_effect = Exception("minio unreachable")

    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["checks"]["database"] == "ok"
    assert "error" in data["checks"]["minio"]
    assert data["checks"]["redis"] == "ok"


@pytest.mark.usefixtures("override_deps")
def test_health_redis_down(client, mock_db, mock_storage):
    """Health endpoint should report degraded when Redis is down."""
    with patch("app.api.routes.health.Redis") as mock_redis:
        mock_redis.from_url.side_effect = Exception("redis unreachable")

        response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["checks"]["database"] == "ok"
    assert data["checks"]["minio"] == "ok"
    assert "error" in data["checks"]["redis"]


@pytest.mark.usefixtures("override_deps")
def test_health_degraded(client, mock_db, mock_storage):
    """Health endpoint should report degraded when multiple services fail."""
    mock_db.execute.side_effect = Exception("database down")
    mock_storage.ensure_bucket.side_effect = Exception("minio down")

    with patch("app.api.routes.health.Redis") as mock_redis:
        redis_mock = AsyncMock()
        redis_mock.close.return_value = None
        mock_redis.from_url.return_value = redis_mock

        response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert "error" in data["checks"]["database"]
    assert "error" in data["checks"]["minio"]
    assert data["checks"]["redis"] == "ok"
