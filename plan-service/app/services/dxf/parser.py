"""DXF parser — extracts entities from DXF files using ezdxf."""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import ezdxf
from ezdxf.tools.text import plain_mtext

logger = logging.getLogger(__name__)

# INSUNITS header values to meters conversion factor.
_UNIT_SCALE_TO_METERS = {
    0: 1.0,  # unitless
    1: 0.0254,  # inches
    2: 0.3048,  # feet
    3: 1609.344,  # miles
    4: 0.001,  # millimeters
    5: 0.01,  # centimeters
    6: 1.0,  # meters
    7: 1000.0,  # kilometers
    8: 2.54e-5,  # microinches
    9: 2.54e-8,  # mils
    10: 0.9144,  # yards
    11: 0.3048,  # angstroms (fallback to feet scale, rarely used)
    12: 1.0e-10,  # nanometers
    13: 1.0e-6,  # microns
    14: 0.0254,  # decimeters (fallback)
    15: 0.1,  # decimeters to meters
}

_UNIT_NAME = {
    0: "unknown",
    1: "inches",
    2: "feet",
    3: "miles",
    4: "millimeters",
    5: "centimeters",
    6: "meters",
    7: "kilometers",
    8: "microinches",
    9: "mils",
    10: "yards",
    11: "angstroms",
    12: "nanometers",
    13: "microns",
    14: "decimeters",
    15: "decimeters",
}


@dataclass
class PolylineEntity:
    """A lightweight polyline entity."""

    points: list[tuple[float, float]]
    is_closed: bool
    has_arc: bool


@dataclass
class LineEntity:
    """A straight line segment."""

    start: tuple[float, float]
    end: tuple[float, float]


@dataclass
class ArcEntity:
    """A circular arc."""

    center: tuple[float, float]
    radius: float
    start_angle: float
    end_angle: float


@dataclass
class TextEntity:
    """A text label."""

    content: str
    position: tuple[float, float]
    text_type: str  # "TEXT" or "MTEXT"


@dataclass
class DimensionEntity:
    """A dimension annotation."""

    measurement_text: str
    position: tuple[float, float]
    def_point: tuple[float, float]


@dataclass
class InsertEntity:
    """A block insert reference."""

    name: str
    insert_point: tuple[float, float]
    scale: float


@dataclass
class DxfMetadata:
    """High-level metadata extracted from a DXF file."""

    dxf_version: str
    units: str
    extents_min: tuple[float, float]
    extents_max: tuple[float, float]


@dataclass
class DxfEntities:
    """Container for all entities extracted from a DXF file."""

    polylines: list[PolylineEntity] = field(default_factory=list)
    lines: list[LineEntity] = field(default_factory=list)
    arcs: list[ArcEntity] = field(default_factory=list)
    texts: list[TextEntity] = field(default_factory=list)
    dimensions: list[DimensionEntity] = field(default_factory=list)
    blocks: list[InsertEntity] = field(default_factory=list)
    metadata: DxfMetadata = field(
        default_factory=lambda: DxfMetadata(
            dxf_version="unknown",
            units="unknown",
            extents_min=(0.0, 0.0),
            extents_max=(0.0, 0.0),
        ),
    )


def _point_2d(point: tuple[Any, ...] | list[Any]) -> tuple[float, float]:
    """Return the first two coordinates of a point-like object."""
    return (float(point[0]), float(point[1]))


def _extract_polyline(entity: Any) -> PolylineEntity | None:
    """Extract a PolylineEntity from an LWPOLYLINE or POLYLINE entity."""
    try:
        points = []
        for pt in entity.get_points(format="xyseb"):
            points.append((float(pt[0]), float(pt[1])))

        has_arc = any(abs(pt[4]) > 1e-9 for pt in entity.get_points(format="xyseb"))
        is_closed = entity.closed if hasattr(entity, "closed") else False
        return PolylineEntity(
            points=points,
            is_closed=is_closed,
            has_arc=has_arc,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Skipping corrupt LWPOLYLINE entity: %s", exc)
        return None


def _extract_line(entity: Any) -> LineEntity | None:
    """Extract a LineEntity from a LINE entity."""
    try:
        return LineEntity(
            start=_point_2d(entity.dxf.start),
            end=_point_2d(entity.dxf.end),
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Skipping corrupt LINE entity: %s", exc)
        return None


def _extract_arc(entity: Any) -> ArcEntity | None:
    """Extract an ArcEntity from an ARC entity."""
    try:
        return ArcEntity(
            center=_point_2d(entity.dxf.center),
            radius=float(entity.dxf.radius),
            start_angle=float(entity.dxf.start_angle),
            end_angle=float(entity.dxf.end_angle),
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Skipping corrupt ARC entity: %s", exc)
        return None


def _extract_text(entity: Any) -> TextEntity | None:
    """Extract a TextEntity from TEXT or MTEXT."""
    try:
        if entity.dxftype() == "TEXT":
            return TextEntity(
                content=str(entity.dxf.text),
                position=_point_2d(entity.dxf.insert),
                text_type="TEXT",
            )
        if entity.dxftype() == "MTEXT":
            raw = str(getattr(entity, "text", ""))
            return TextEntity(
                content=str(plain_mtext(raw)),
                position=_point_2d(entity.dxf.insert),
                text_type="MTEXT",
            )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Skipping corrupt TEXT/MTEXT entity: %s", exc)
    return None


def _extract_dimension(entity: Any) -> DimensionEntity | None:
    """Extract a DimensionEntity from a DIMENSION entity."""
    try:
        text = str(entity.dxf.text)
        # "<>" means the dimension uses the auto-generated measurement.
        if not text or text == "<>":
            try:
                measurement = entity.get_measurement()
                text = str(measurement) if measurement is not None else ""
            except Exception:  # noqa: BLE001
                text = ""
        position = _point_2d(entity.dxf.text_midpoint)
        def_point = _point_2d(entity.dxf.defpoint)
        return DimensionEntity(
            measurement_text=text,
            position=position,
            def_point=def_point,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Skipping corrupt DIMENSION entity: %s", exc)
        return None


def _extract_insert(entity: Any) -> InsertEntity | None:
    """Extract an InsertEntity from an INSERT entity."""
    try:
        xscale = float(getattr(entity.dxf, "xscale", 1.0) or 1.0)
        yscale = float(getattr(entity.dxf, "yscale", 1.0) or 1.0)
        scale = math.sqrt(xscale * yscale)
        return InsertEntity(
            name=str(entity.dxf.name),
            insert_point=_point_2d(entity.dxf.insert),
            scale=scale,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Skipping corrupt INSERT entity: %s", exc)
        return None


def _build_metadata(doc: ezdxf.document.Drawing) -> DxfMetadata:
    """Build DxfMetadata from the DXF document header."""
    try:
        dxf_version = doc.dxfversion
    except Exception:  # noqa: BLE001
        dxf_version = "unknown"

    try:
        units_value = doc.header.get("$INSUNITS", 0)
        if isinstance(units_value, (list, tuple)):
            units_value = units_value[0]
        units_value = int(units_value)
    except Exception:  # noqa: BLE001
        units_value = 0

    units_name = _UNIT_NAME.get(units_value, "unknown")

    try:
        extmin = doc.header.get("$EXTMIN", (0.0, 0.0, 0.0))
        extmax = doc.header.get("$EXTMAX", (0.0, 0.0, 0.0))
        extents_min = _point_2d(extmin)
        extents_max = _point_2d(extmax)
        # DXF defaults use sentinel values (1e20, -1e20) when extents are unset.
        if (
            extents_min[0] > extents_max[0]
            or extents_min[1] > extents_max[1]
            or abs(extents_min[0]) > 1e18
            or abs(extents_max[0]) > 1e18
        ):
            extents_min = (0.0, 0.0)
            extents_max = (0.0, 0.0)
    except Exception:  # noqa: BLE001
        extents_min = (0.0, 0.0)
        extents_max = (0.0, 0.0)

    return DxfMetadata(
        dxf_version=dxf_version,
        units=units_name,
        extents_min=extents_min,
        extents_max=extents_max,
    )


def detect_scale(entities: DxfEntities) -> float:
    """Detect the drawing scale factor to convert geometry to meters.

    Priority:
    1. $INSUNITS header value.
    2. Dimension text vs geometric distance ratio.
    3. Default to 1.0.
    """
    # 1. Header units
    units_value = _units_value_from_name(entities.metadata.units)
    if units_value is not None and units_value != 0:
        scale = _UNIT_SCALE_TO_METERS.get(units_value, 1.0)
        logger.debug("Detected scale from $INSUNITS (%s): %s", entities.metadata.units, scale)
        return scale

    # 2. Dimension inference
    for dimension in entities.dimensions:
        measured_value = _parse_dimension_text(dimension.measurement_text)
        if measured_value is None or measured_value <= 0:
            continue
        dx = dimension.position[0] - dimension.def_point[0]
        dy = dimension.position[1] - dimension.def_point[1]
        geometric_distance = math.hypot(dx, dy)
        if geometric_distance > 1e-9:
            scale = measured_value / geometric_distance
            logger.debug(
                "Detected scale from DIMENSION: %s / %s = %s",
                measured_value,
                geometric_distance,
                scale,
            )
            return scale

    logger.debug("No scale detected, defaulting to 1.0")
    return 1.0


def _units_value_from_name(units_name: str) -> int | None:
    """Reverse lookup a unit code from its human-readable name."""
    for code, name in _UNIT_NAME.items():
        if name.lower() == units_name.lower():
            return code
    return None


def _parse_dimension_text(text: str) -> float | None:
    """Parse a dimension measurement string into a float.

    Strips common suffixes and whitespace, e.g. '4.50', '1200 mm'.
    """
    if not text:
        return None
    cleaned = text.strip().lower()
    for suffix in ("mm", "cm", "m", "ft", "'", '"'):
        if cleaned.endswith(suffix):
            cleaned = cleaned[: -len(suffix)].strip()
            break
    try:
        return float(cleaned.replace(",", "."))
    except ValueError:
        return None


class DxfParser:
    """Parses DXF files and extracts relevant entities."""

    def parse(self, file_path: str) -> DxfEntities:
        """Extract all relevant entities from a DXF file.

        Args:
            file_path: Path to the DXF file on disk.

        Returns:
            A DxfEntities container with extracted geometry and metadata.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"DXF file not found: {file_path}")

        doc = ezdxf.readfile(str(path))
        msp = doc.modelspace()

        entities = DxfEntities(metadata=_build_metadata(doc))

        # LWPOLYLINE / POLYLINE
        for entity in msp.query("LWPOLYLINE POLYLINE"):
            poly = _extract_polyline(entity)
            if poly:
                entities.polylines.append(poly)

        # LINE
        for entity in msp.query("LINE"):
            line = _extract_line(entity)
            if line:
                entities.lines.append(line)

        # ARC
        for entity in msp.query("ARC"):
            arc = _extract_arc(entity)
            if arc:
                entities.arcs.append(arc)

        # TEXT / MTEXT
        for entity in msp.query("TEXT MTEXT"):
            text = _extract_text(entity)
            if text:
                entities.texts.append(text)

        # DIMENSION
        for entity in msp.query("DIMENSION"):
            dimension = _extract_dimension(entity)
            if dimension:
                entities.dimensions.append(dimension)

        # INSERT (block references)
        for entity in msp.query("INSERT"):
            insert = _extract_insert(entity)
            if insert:
                entities.blocks.append(insert)

        # Log unsupported entity types for debugging
        supported = {
            "LWPOLYLINE",
            "POLYLINE",
            "LINE",
            "ARC",
            "TEXT",
            "MTEXT",
            "DIMENSION",
            "INSERT",
        }
        unsupported = set()
        for entity in msp:
            name = entity.dxftype()
            if name not in supported:
                unsupported.add(name)
        if unsupported:
            logger.debug("Unsupported entity types skipped: %s", sorted(unsupported))

        logger.info(
            "Parsed DXF '%s': %d polylines, %d lines, %d arcs, %d texts, "
            "%d dimensions, %d blocks, units=%s",
            path.name,
            len(entities.polylines),
            len(entities.lines),
            len(entities.arcs),
            len(entities.texts),
            len(entities.dimensions),
            len(entities.blocks),
            entities.metadata.units,
        )

        return entities
