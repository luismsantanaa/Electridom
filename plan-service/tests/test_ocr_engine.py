"""Tests for the OCR engine."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import numpy as np
from shapely import Polygon

from app.services.pdf.ocr_engine import OcrEngine


def test_extract_text_no_tesseract():
    """When Tesseract is unavailable, extraction returns an empty string."""
    engine = OcrEngine(language="spa")
    engine._tesseract_available = False
    image = np.ones((100, 100, 3), dtype=np.uint8) * 255

    result = engine.extract_text(image)

    assert result == ""


def test_extract_text_with_mock():
    """When Tesseract is mocked, extraction returns the mocked text."""
    engine = OcrEngine(language="spa")
    engine._tesseract_available = True
    image = np.ones((100, 100, 3), dtype=np.uint8) * 255

    mock_image = MagicMock()
    with patch("app.services.pdf.ocr_engine.Image.fromarray", return_value=mock_image):
        with patch("app.services.pdf.ocr_engine.pytesseract") as mock_tesseract:
            mock_tesseract.image_to_string.return_value = "SALA\n"
            result = engine.extract_text(image)

    assert result == "SALA"
    mock_tesseract.image_to_string.assert_called_once()


def test_extract_text_with_region():
    """When a region is provided, the engine crops before OCR."""
    engine = OcrEngine(language="spa")
    engine._tesseract_available = True
    image = np.ones((200, 200, 3), dtype=np.uint8) * 255
    region = Polygon([(10, 10), (90, 10), (90, 90), (10, 90)])

    mock_image = MagicMock()
    with patch("app.services.pdf.ocr_engine.Image.fromarray", return_value=mock_image):
        with patch("app.services.pdf.ocr_engine.pytesseract") as mock_tesseract:
            mock_tesseract.image_to_string.return_value = "COCINA\n"
            result = engine.extract_text(image, region)

    assert result == "COCINA"


def test_tesseract_availability_check():
    """The availability check should return a boolean."""
    engine = OcrEngine(language="spa")

    assert isinstance(engine._tesseract_available, bool)


def test_check_tesseract_unavailable_module():
    """If the pytesseract module is unavailable, availability is False."""
    with patch("app.services.pdf.ocr_engine.pytesseract", None):
        engine = OcrEngine(language="spa")
        assert engine._tesseract_available is False


def test_extract_text_tesseract_failure():
    """A Tesseract runtime error should gracefully return an empty string."""
    engine = OcrEngine(language="spa")
    engine._tesseract_available = True
    image = np.ones((50, 50, 3), dtype=np.uint8) * 255

    with patch("app.services.pdf.ocr_engine.pytesseract") as mock_tesseract:
        mock_tesseract.image_to_string.side_effect = RuntimeError("Tesseract failed")
        result = engine.extract_text(image)

    assert result == ""


def test_extract_words_maps_coords_back_to_original_scale():
    """Word boxes from an upscaled OCR pass should map to original pixels."""
    engine = OcrEngine(language="spa")
    engine._tesseract_available = True
    image = np.ones((100, 100, 3), dtype=np.uint8) * 255

    mock_data = {
        "text": ["SALA", ""],
        "conf": ["88", "-1"],
        "left": [40, 0],
        "top": [20, 0],
        "width": [80, 0],
        "height": [40, 0],
    }

    mock_image = MagicMock()
    with patch("app.services.pdf.ocr_engine.Image.fromarray", return_value=mock_image):
        with patch("app.services.pdf.ocr_engine.pytesseract") as mock_tesseract:
            mock_tesseract.Output.DICT = "dict"
            mock_tesseract.image_to_data.return_value = mock_data
            words = engine.extract_words(image, scale_factor=2.0)

    assert len(words) == 1
    assert words[0].text == "SALA"
    assert words[0].left == 20  # 40 / 2
    assert words[0].top == 10  # 20 / 2
    assert words[0].cx == 40.0  # 20 + 40/2
    assert words[0].cy == 20.0  # 10 + 20/2
