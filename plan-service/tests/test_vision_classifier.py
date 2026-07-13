"""Tests for OpenAI Vision API fallback classifier."""

import json
from unittest.mock import AsyncMock, patch

import pytest

from app.services.ai.vision_classifier import (
    _daily_cache,
    _daily_call_count,
    get_daily_stats,
)


class TestVisionClassifier:
    """Tests for the Vision API fallback."""

    def test_get_daily_stats_default(self):
        """Test default stats when no calls made."""
        stats = get_daily_stats()
        assert stats["calls_today"] == 0
        assert stats["max_daily_calls"] == 5
        assert stats["cache_size"] == 0
        assert stats["model"] == "gpt-4o-mini"

    def test_get_daily_stats_with_cache(self):
        """Test stats reflect cache entries."""
        _daily_cache["test_key"] = [{"name": "Sala"}]
        stats = get_daily_stats()
        assert stats["cache_size"] >= 1
        _daily_cache.clear()

    @pytest.mark.asyncio
    async def test_analyze_raises_without_api_key(self):
        """Test that analyze raises when API key is not configured."""
        from app.services.ai import vision_classifier

        original_key = vision_classifier.OPENAI_API_KEY
        vision_classifier.OPENAI_API_KEY = ""

        try:
            with pytest.raises(RuntimeError, match="OPENAI_API_KEY not configured"):
                await vision_classifier.analyze_with_vision("/fake/path.png")
        finally:
            vision_classifier.OPENAI_API_KEY = original_key

    @pytest.mark.asyncio
    async def test_analyze_uses_cache(self, tmp_path):
        """Test that cached results are returned without API call."""
        from app.services.ai import vision_classifier

        cache_key = "test_cache_key"
        cached_spaces = [
            {
                "name": "Sala",
                "space_type": "living_room",
                "area_m2": 20.0,
                "perimeter_m": 18.0,
                "vertices": [{"x": 0, "y": 0}, {"x": 100, "y": 0}],
                "confidence": 0.9,
                "classification_method": "openai_vision",
                "is_verified": False,
            }
        ]
        vision_classifier._daily_cache[cache_key] = cached_spaces

        try:
            result = await vision_classifier.analyze_with_vision(
                "/fake/path.png", cache_key=cache_key
            )
            assert result == cached_spaces
        finally:
            vision_classifier._daily_cache.clear()

    @pytest.mark.asyncio
    async def test_analyze_rate_limit(self, tmp_path):
        """Test that rate limit is enforced."""
        from app.services.ai import vision_classifier

        original_count = vision_classifier._daily_call_count
        original_max = vision_classifier.MAX_DAILY_CALLS
        vision_classifier._daily_call_count = 5
        vision_classifier.MAX_DAILY_CALLS = 5
        vision_classifier.OPENAI_API_KEY = "test-key"

        try:
            with pytest.raises(RuntimeError, match="Daily Vision API call limit"):
                await vision_classifier.analyze_with_vision("/fake/path.png")
        finally:
            vision_classifier._daily_call_count = original_count
            vision_classifier.MAX_DAILY_CALLS = original_max
