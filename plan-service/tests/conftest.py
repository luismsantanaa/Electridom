"""Test configuration and fixtures."""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create a test client for the FastAPI app.

    Note: This uses the app without database/storage connections.
    Integration tests with real services will be added in Fase 2.
    """
    # For now, we test that the app can be imported and configured
    # Real integration tests require Docker services running
    pass
