"""OpenAI Vision API fallback for low-quality raster plans.

When OpenCV/PyMuPDF detection confidence is below threshold,
this service sends the plan image to OpenAI Vision for analysis.
"""

import base64
import json
import logging
import os
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_VISION_MODEL", "gpt-4o-mini")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
MAX_DAILY_CALLS = int(os.getenv("OPENAI_VISION_MAX_DAILY", "5"))

# Simple in-memory counter for daily calls (reset on restart)
_daily_call_count = 0
_daily_cache: dict[str, list[dict[str, Any]]] = {}

VISION_PROMPT = """Analyze this architectural floor plan image and detect rooms/spaces.

For each detected space, return a JSON object with:
- name: descriptive name (e.g., "Sala", "Dormitorio 1", "Cocina")
- space_type: one of bedroom, bathroom, kitchen, living_room, dining_room, hallway, garage, office, laundry, storage, balcony, stairs, unknown
- area_m2: estimated area in square meters
- perimeter_m: estimated perimeter in meters
- vertices: array of {x, y} coordinates as percentages (0-100) of image width/height
- confidence: confidence score 0.0-1.0

Return ONLY a valid JSON array of spaces. Example:
[
  {
    "name": "Sala",
    "space_type": "living_room",
    "area_m2": 18.5,
    "perimeter_m": 17.2,
    "vertices": [{"x": 10, "y": 10}, {"x": 40, "y": 10}, {"x": 40, "y": 40}, {"x": 10, "y": 40}],
    "confidence": 0.85
  }
]
"""


def _encode_image(image_path: str) -> str:
    """Read image file and return base64 encoded string."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def _get_mime_type(image_path: str) -> str:
    """Determine MIME type from file extension."""
    ext = Path(image_path).suffix.lower()
    mime_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }
    return mime_map.get(ext, "image/png")


async def analyze_with_vision(image_path: str, cache_key: str | None = None) -> list[dict[str, Any]]:
    """Send image to OpenAI Vision API for space detection.

    Args:
        image_path: Path to the image file (PNG/JPG).
        cache_key: Optional cache key to avoid reprocessing same plan.

    Returns:
        List of detected spaces in the standard format.

    Raises:
        RuntimeError: If API key not configured or rate limit exceeded.
        httpx.HTTPError: If API call fails.
    """
    global _daily_call_count

    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY not configured. Set it in environment.")

    # Check cache
    if cache_key and cache_key in _daily_cache:
        logger.info("Vision API cache hit for key: %s", cache_key)
        return _daily_cache[cache_key]

    # Check rate limit
    if _daily_call_count >= MAX_DAILY_CALLS:
        raise RuntimeError(
            f"Daily Vision API call limit reached ({MAX_DAILY_CALLS}). "
            "Increase OPENAI_VISION_MAX_DAILY or wait until tomorrow."
        )

    # Encode image
    image_b64 = _encode_image(image_path)
    mime_type = _get_mime_type(image_path)

    # Call OpenAI API
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{OPENAI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": OPENAI_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": VISION_PROMPT},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{image_b64}",
                                    "detail": "high",
                                },
                            },
                        ],
                    }
                ],
                "max_tokens": 4096,
                "temperature": 0.1,
            },
        )
        response.raise_for_status()

    _daily_call_count += 1

    # Parse response
    result = response.json()
    content = result["choices"][0]["message"]["content"]

    # Extract JSON from response (handle markdown code blocks)
    content = content.strip()
    if content.startswith("```"):
        # Remove markdown code block
        lines = content.split("\n")
        content = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

    try:
        spaces = json.loads(content)
    except json.JSONDecodeError:
        logger.error("Failed to parse Vision API response: %s", content[:500])
        raise RuntimeError("Failed to parse Vision API response as JSON")

    # Normalize spaces to standard format
    normalized = []
    for space in spaces:
        normalized.append(
            {
                "name": space.get("name", "Unknown"),
                "space_type": space.get("space_type", "unknown"),
                "area_m2": float(space.get("area_m2", 0)),
                "perimeter_m": float(space.get("perimeter_m", 0)),
                "vertices": [
                    {"x": float(v.get("x", 0)), "y": float(v.get("y", 0))}
                    for v in space.get("vertices", [])
                ],
                "confidence": float(space.get("confidence", 0.5)),
                "classification_method": "openai_vision",
                "is_verified": False,
            }
        )

    # Cache result
    if cache_key:
        _daily_cache[cache_key] = normalized

    logger.info("Vision API detected %d spaces", len(normalized))
    return normalized


def get_daily_stats() -> dict[str, Any]:
    """Get daily usage statistics."""
    return {
        "calls_today": _daily_call_count,
        "max_daily_calls": MAX_DAILY_CALLS,
        "cache_size": len(_daily_cache),
        "api_configured": bool(OPENAI_API_KEY),
        "model": OPENAI_MODEL,
    }
