"""Tests for the MinIO storage service."""

from unittest.mock import MagicMock

import pytest
from minio.error import S3Error

from app.core.storage import StorageService


@pytest.fixture
def storage_service(monkeypatch):
    """Return a StorageService instance with a mocked MinIO client."""
    service = StorageService()
    service.client = MagicMock()
    return service


def test_upload_file(storage_service):
    """upload_file should put an object in MinIO."""
    storage_service.client.put_object.return_value = None

    storage_service.upload_file("key", b"data", "application/pdf")

    storage_service.client.put_object.assert_called_once()
    args = storage_service.client.put_object.call_args.args
    kwargs = storage_service.client.put_object.call_args.kwargs
    assert args[0] == storage_service.bucket
    assert args[1] == "key"
    assert kwargs["length"] == len(b"data")
    assert kwargs["content_type"] == "application/pdf"


def test_download_file(storage_service):
    """download_file should return the object content."""
    response = MagicMock()
    response.read.return_value = b"file content"
    response.close.return_value = None
    response.release_conn.return_value = None
    storage_service.client.get_object.return_value = response

    data = storage_service.download_file("key")

    assert data == b"file content"
    storage_service.client.get_object.assert_called_once_with(storage_service.bucket, "key")
    response.close.assert_called_once()
    response.release_conn.assert_called_once()


def test_delete_file(storage_service):
    """delete_file should remove the object from MinIO."""
    storage_service.delete_file("key")

    storage_service.client.remove_object.assert_called_once_with(storage_service.bucket, "key")


def test_file_exists_true(storage_service):
    """file_exists should return True when the object exists."""
    storage_service.client.stat_object.return_value = MagicMock()

    assert storage_service.file_exists("key") is True


def test_file_exists_false(storage_service):
    """file_exists should return False when the object does not exist."""
    storage_service.client.stat_object.side_effect = S3Error(
        None, "NoSuchKey", "No such object", "", "", "", None, None
    )

    assert storage_service.file_exists("key") is False


def test_ensure_bucket_creates_if_not_exists(storage_service):
    """ensure_bucket should create the bucket when it does not exist."""
    storage_service.client.bucket_exists.return_value = False

    storage_service.ensure_bucket()

    storage_service.client.make_bucket.assert_called_once_with(storage_service.bucket)


def test_ensure_bucket_skips_if_exists(storage_service):
    """ensure_bucket should not recreate an existing bucket."""
    storage_service.client.bucket_exists.return_value = True

    storage_service.ensure_bucket()

    storage_service.client.make_bucket.assert_not_called()
