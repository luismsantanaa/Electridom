"""Tests for configuration module."""

from app.core.config import Settings, settings


def test_settings_default_values():
    """Settings should have sensible defaults."""
    s = Settings()
    assert s.app_name == "plan-service"
    assert s.app_env == "development"
    assert s.debug is True
    assert s.port == 8000
    assert s.max_file_size_mb == 50
    assert s.allowed_file_types == ["pdf", "dxf"]


def test_settings_singleton():
    """Settings singleton should be accessible."""
    assert settings is not None
    assert settings.app_name == "plan-service"
