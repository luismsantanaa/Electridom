"""Space classifier — infers room type from text and heuristics."""

from __future__ import annotations

import unicodedata

from shapely import Point, Polygon

from app.services.dxf.parser import TextEntity


def _classification_result(
    space_type: str,
    confidence: float,
    method: str,
    suggested_name: str,
) -> dict[str, object]:
    """Build a standard classification result dictionary."""
    return {
        "space_type": space_type,
        "confidence": confidence,
        "method": method,
        "suggested_name": suggested_name,
    }


class SpaceClassifier:
    """Classifies detected spaces by type (sala, cocina, baño, etc.)."""

    SPACE_TYPES = [
        "sala",
        "comedor",
        "cocina",
        "bano",
        "dormitorio",
        "pasillo",
        "garage",
        "lavanderia",
        "balcon",
        "escalera",
        "oficina",
        "deposito",
        "otro",
    ]

    # Maps a normalized keyword to the canonical space type.
    _TEXT_KEYWORDS: dict[str, str] = {
        # Living / dining
        "sala": "sala",
        "salon": "sala",
        "estar": "sala",
        "comedor": "comedor",
        # Kitchen
        "cocina": "cocina",
        "kitchen": "cocina",
        # Bathroom
        "bano": "bano",
        "banos": "bano",
        "wc": "bano",
        "toilet": "bano",
        "inodoro": "bano",
        "aseo": "bano",
        # Bedroom
        "dormitorio": "dormitorio",
        "dormitorios": "dormitorio",
        "dorm": "dormitorio",
        "habitacion": "dormitorio",
        "habitaciones": "dormitorio",
        "cuarto": "dormitorio",
        "cuartos": "dormitorio",
        "recamara": "dormitorio",
        "recamaras": "dormitorio",
        # Hallway
        "pasillo": "pasillo",
        "pasillos": "pasillo",
        "corredor": "pasillo",
        "hall": "pasillo",
        # Garage
        "garage": "garage",
        "garaje": "garage",
        "cochera": "garage",
        # Laundry
        "lavanderia": "lavanderia",
        "laundry": "lavanderia",
        # Balcony
        "balcon": "balcon",
        "balcones": "balcon",
        # Stairs
        "escalera": "escalera",
        "escaleras": "escalera",
        # Office
        "oficina": "oficina",
        "estudio": "oficina",
        # Storage
        "deposito": "deposito",
        "bodega": "deposito",
        "almacen": "deposito",
    }

    def classify(
        self,
        polygon: Polygon,
        texts: list[TextEntity],
        scale: float = 1.0,
    ) -> dict[str, object]:
        """Classify a space using text content and heuristics.

        Args:
            polygon: Shapely polygon in meters.
            texts: Text/MTEXT entities found in the drawing.
            scale: Scale factor from drawing units to meters.

        Returns:
            Dictionary with space_type, confidence, method, suggested_name.
        """
        # 1. Text match: any text inside the polygon.
        text_result = self._classify_by_text(polygon, texts, scale)
        if text_result:
            return text_result

        # 2. Shape heuristics.
        shape_result = self._classify_by_shape(polygon)
        if shape_result:
            return shape_result

        # 3. Fallback.
        return _classification_result("otro", 0.3, "fallback", "Space")

    def _classify_by_text(
        self,
        polygon: Polygon,
        texts: list[TextEntity],
        scale: float,
    ) -> dict[str, object] | None:
        """Try to classify by a text label contained in the polygon."""
        for text in texts:
            position = (text.position[0] * scale, text.position[1] * scale)
            point = Point(position)
            if not point.within(polygon) and not polygon.contains(point):
                continue

            normalized = self._normalize_text(text.content)
            if not normalized:
                continue

            # Direct keyword match.
            if normalized in self._TEXT_KEYWORDS:
                space_type = self._TEXT_KEYWORDS[normalized]
                return _classification_result(
                    space_type,
                    0.95,
                    "text_match",
                    text.content.strip() or space_type.capitalize(),
                )

            # Partial / fuzzy match: keyword is a substring.
            for keyword, space_type in self._TEXT_KEYWORDS.items():
                if keyword in normalized or normalized in keyword:
                    return _classification_result(
                        space_type,
                        0.85,
                        "text_match_fuzzy",
                        text.content.strip() or space_type.capitalize(),
                    )

        return None

    def _classify_by_shape(self, polygon: Polygon) -> dict[str, object] | None:
        """Classify using bounding-box ratio and area heuristics."""
        area = float(polygon.area)
        minx, miny, maxx, maxy = polygon.bounds
        width = maxx - minx
        height = maxy - miny

        if width <= 0 or height <= 0:
            return None

        ratio = max(width, height) / min(width, height)

        # Elongated shapes are almost always hallways, regardless of area.
        if ratio > 3.0:
            return _classification_result("pasillo", 0.5, "heuristic_ratio", "Pasillo")

        # Size heuristic.
        if area < 2.0:
            return _classification_result("pasillo", 0.5, "heuristic_size", "Pasillo")
        if area < 6.0:
            return _classification_result("bano", 0.6, "heuristic_size", "Bano")
        if 8.0 <= area <= 15.0:
            return _classification_result("cocina", 0.5, "heuristic_size", "Cocina")
        if area > 12.0:
            return _classification_result("sala", 0.5, "heuristic_size", "Sala")

        # Square-ish fallback when no size bucket matched.
        if 0.8 <= ratio <= 1.2:
            return _classification_result("bano", 0.4, "heuristic_ratio", "Bano")

        return None

    @staticmethod
    def _normalize_text(text: str) -> str:
        """Normalize text for matching: lowercase, strip, remove accents."""
        if not text:
            return ""
        normalized = (
            unicodedata.normalize("NFKD", text.strip().lower())
            .encode("ASCII", "ignore")
            .decode("ASCII")
        )
        # Remove common punctuation.
        for char in ".,;:_-*/()[]{}':":
            normalized = normalized.replace(char, " ")
        return " ".join(normalized.split())
