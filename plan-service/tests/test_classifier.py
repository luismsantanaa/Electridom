"""Tests for the space classifier."""

from __future__ import annotations

from shapely import Polygon

from app.services.dxf.classifier import SpaceClassifier
from app.services.dxf.parser import TextEntity


def test_classify_text_match_direct():
    """TEXT 'COCINA' inside a polygon should classify as cocina."""
    classifier = SpaceClassifier()
    polygon = Polygon([(0, 0), (5, 0), (5, 5), (0, 5)])
    texts = [TextEntity(content="COCINA", position=(2.5, 2.5), text_type="TEXT")]

    result = classifier.classify(polygon, texts, scale=1.0)

    assert result["space_type"] == "cocina"
    assert result["confidence"] >= 0.9
    assert result["method"] == "text_match"


def test_classify_text_match_with_accents():
    """TEXT 'BAÑO' should normalize to 'bano'."""
    classifier = SpaceClassifier()
    polygon = Polygon([(0, 0), (2, 0), (2, 2), (0, 2)])
    texts = [TextEntity(content="BAÑO", position=(1, 1), text_type="TEXT")]

    result = classifier.classify(polygon, texts, scale=1.0)

    assert result["space_type"] == "bano"


def test_classify_text_match_case_insensitive():
    """Mixed-case text should still match."""
    classifier = SpaceClassifier()
    polygon = Polygon([(0, 0), (5, 0), (5, 5), (0, 5)])
    texts = [TextEntity(content="Sala", position=(2.5, 2.5), text_type="TEXT")]

    result = classifier.classify(polygon, texts, scale=1.0)

    assert result["space_type"] == "sala"


def test_classify_heuristic_small():
    """A small polygon with no text should be classified as bano."""
    classifier = SpaceClassifier()
    polygon = Polygon([(0, 0), (2, 0), (2, 2), (0, 2)])

    result = classifier.classify(polygon, [], scale=1.0)

    assert result["space_type"] == "bano"
    assert result["method"] == "heuristic_size"


def test_classify_heuristic_large():
    """A large polygon with no text should be classified as sala."""
    classifier = SpaceClassifier()
    polygon = Polygon([(0, 0), (5, 0), (5, 5), (0, 5)])

    result = classifier.classify(polygon, [], scale=1.0)

    assert result["space_type"] == "sala"
    assert result["method"] == "heuristic_size"


def test_classify_heuristic_elongated():
    """An elongated polygon should be classified as pasillo."""
    classifier = SpaceClassifier()
    polygon = Polygon([(0, 0), (10, 0), (10, 1), (0, 1)])

    result = classifier.classify(polygon, [], scale=1.0)

    assert result["space_type"] == "pasillo"


def test_classify_fallback():
    """A polygon with no text and no matching heuristic should be 'otro'."""
    classifier = SpaceClassifier()
    # Area is 7.0 (between size buckets) and ratio is ~2.3 (not square-ish).
    polygon = Polygon([(0, 0), (4, 0), (4, 1.75), (0, 1.75)])

    result = classifier.classify(polygon, [], scale=1.0)

    assert result["space_type"] == "otro"
    assert result["confidence"] == 0.3


def test_classify_abbreviation():
    """Abbreviation 'DORM' should map to dormitorio."""
    classifier = SpaceClassifier()
    polygon = Polygon([(0, 0), (4, 0), (4, 4), (0, 4)])
    texts = [TextEntity(content="DORM", position=(2, 2), text_type="TEXT")]

    result = classifier.classify(polygon, texts, scale=1.0)

    assert result["space_type"] == "dormitorio"
