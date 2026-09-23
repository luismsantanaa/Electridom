"""PDF scale estimator — infers meters-per-point from dimension annotations.

Architectural PDFs exported from CAD are drawn in paper points (1/72 inch) at
an arbitrary print scale (1:50, 1:75...). To measure real areas we need the
meters-per-point factor. Dimension annotations (cotas) give it away: each cota
text (e.g. "3.80") sits next to a dimension line whose length in points
corresponds to that many meters.
"""

from __future__ import annotations

import logging
import math
import re
import statistics
from typing import Any

logger = logging.getLogger(__name__)

# PDF points are 1/72 inch.
POINTS_TO_METERS = 0.000352778

# A cota looks like "3.80", "0,15", "12.05" — a bare decimal number.
_COTA_RE = re.compile(r"^\d{1,2}(?:[.,]\d{1,2})?$")
# Plausible room-dimension range in meters.
_COTA_MIN_M = 0.3
_COTA_MAX_M = 40.0
# Max distance (points) between a cota text and its dimension line midpoint.
_MAX_PAIR_DISTANCE_PT = 25.0
# Ignore segments shorter than this (points) — ticks and arrowheads.
_MIN_SEGMENT_LENGTH_PT = 5.0
# Minimum cota/line pairs needed for a trustworthy estimate.
_MIN_PAIRS = 5
# Pairs within this relative deviation of the median count as consistent.
_CONSISTENCY_TOLERANCE = 0.2
# Minimum fraction of consistent pairs to accept the estimate.
_MIN_CONSISTENCY = 0.5


def count_dimension_words(page: Any) -> int:
    """Count cota-like words (bare decimal numbers) on a PDF page.

    Floor-plan pages carry dozens of dimension annotations; cover sheets,
    budgets, and notes carry few or none.
    """
    count = 0
    for *_, word, _block, _line, _word in page.get_text("words"):
        token = str(word).strip()
        if _COTA_RE.match(token):
            value = float(token.replace(",", "."))
            if _COTA_MIN_M <= value <= _COTA_MAX_M:
                count += 1
    return count


class PdfScaleEstimator:
    """Estimates the meters-per-point scale of a vectorial/mixed PDF plan."""

    def estimate(self, file_path: str) -> float | None:
        """Return meters-per-point, or None when it cannot be inferred.

        Pairs every dimension-like text with the nearest line segment and
        takes the median of value/length ratios across all pages.
        """
        try:
            import pymupdf
        except ImportError:  # pragma: no cover - fallback import
            import fitz as pymupdf

        ratios: list[float] = []
        doc = pymupdf.open(file_path)
        try:
            for page in doc:
                ratios.extend(self._page_ratios(page))
        finally:
            doc.close()

        if len(ratios) < _MIN_PAIRS:
            logger.info(
                "PDF scale estimation: only %d cota/line pairs — not enough",
                len(ratios),
            )
            return None

        median = statistics.median(ratios)
        consistent = [
            r for r in ratios if abs(r - median) / median < _CONSISTENCY_TOLERANCE
        ]
        if len(consistent) / len(ratios) < _MIN_CONSISTENCY:
            logger.info(
                "PDF scale estimation: pairs too inconsistent (%d/%d near median)",
                len(consistent),
                len(ratios),
            )
            return None

        scale = statistics.median(consistent)
        logger.info(
            "PDF scale estimated: %.6f m/pt (~1:%.0f) from %d pairs (%d consistent)",
            scale,
            scale / POINTS_TO_METERS,
            len(ratios),
            len(consistent),
        )
        return scale

    def _page_ratios(self, page: Any) -> list[float]:
        """Collect cota-value / segment-length ratios for one page."""
        cotas: list[tuple[float, float, float]] = []
        for x0, y0, x1, y1, word, *_ in page.get_text("words"):
            token = str(word).strip()
            if not _COTA_RE.match(token):
                continue
            value = float(token.replace(",", "."))
            if _COTA_MIN_M <= value <= _COTA_MAX_M:
                cotas.append((value, (x0 + x1) / 2.0, (y0 + y1) / 2.0))

        segments: list[tuple[float, float, float]] = []
        for path in page.get_drawings():
            for item in path.get("items", []):
                if item[0] != "l":
                    continue
                a, b = item[1], item[2]
                length = math.hypot(b.x - a.x, b.y - a.y)
                if length >= _MIN_SEGMENT_LENGTH_PT:
                    segments.append(((a.x + b.x) / 2.0, (a.y + b.y) / 2.0, length))

        if not cotas or not segments:
            return []

        ratios: list[float] = []
        for value, cx, cy in cotas:
            best: tuple[float, float] | None = None
            for sx, sy, length in segments:
                distance = math.hypot(sx - cx, sy - cy)
                if distance < _MAX_PAIR_DISTANCE_PT and (
                    best is None or distance < best[0]
                ):
                    best = (distance, length)
            if best:
                ratios.append(value / best[1])
        return ratios
