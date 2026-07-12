"""Space classifier — infers room type from text and heuristics.

TODO (Fase 3): Implement classification using text matching + size/ratio heuristics.
"""


class SpaceClassifier:
    """Classifies detected spaces by type (sala, cocina, baño, etc.)."""

    SPACE_TYPES = [
        "sala", "comedor", "cocina", "bano", "dormitorio",
        "pasillo", "garage", "lavanderia", "balcon", "escalera",
        "oficina", "deposito", "otro",
    ]

    def classify(self, polygon, texts: list) -> dict:
        """Classify a space using text content and heuristics.

        Returns:
        - space_type: str
        - confidence: float (0-1)
        - method: "text_match" | "heuristic_size" | "heuristic_ratio"
        - suggested_name: str
        """
        raise NotImplementedError("Space classifier will be implemented in Fase 3")
