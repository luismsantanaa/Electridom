"""Tests for the DXF parser."""

from __future__ import annotations

import ezdxf
import pytest

from app.services.dxf.parser import DxfParser, detect_scale


@pytest.fixture
def parser():
    """Return a fresh DxfParser instance."""
    return DxfParser()


def test_parse_closed_lwpolyline(parser, tmp_path):
    """A closed LWPOLYLINE should be extracted as a closed polyline entity."""
    filepath = tmp_path / "closed.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (10, 0), (10, 10), (0, 10)], close=True)
    doc.saveas(str(filepath))

    entities = parser.parse(str(filepath))

    assert len(entities.polylines) == 1
    poly = entities.polylines[0]
    assert poly.is_closed is True
    assert poly.points == [(0.0, 0.0), (10.0, 0.0), (10.0, 10.0), (0.0, 10.0)]


def test_parse_open_lwpolyline(parser, tmp_path):
    """An open LWPOLYLINE should be extracted without the closed flag."""
    filepath = tmp_path / "open.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (10, 0), (10, 10)], close=False)
    doc.saveas(str(filepath))

    entities = parser.parse(str(filepath))

    assert len(entities.polylines) == 1
    assert entities.polylines[0].is_closed is False
    assert len(entities.polylines[0].points) == 3


def test_parse_line_entities(parser, tmp_path):
    """LINE entities should be extracted with start/end points."""
    filepath = tmp_path / "lines.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_line((0, 0), (10, 0))
    msp.add_line((10, 0), (10, 10))
    doc.saveas(str(filepath))

    entities = parser.parse(str(filepath))

    assert len(entities.lines) == 2
    assert entities.lines[0].start == (0.0, 0.0)
    assert entities.lines[0].end == (10.0, 0.0)


def test_parse_arc_entity(parser, tmp_path):
    """ARC entities should be extracted with center, radius, and angles."""
    filepath = tmp_path / "arc.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_arc((5, 5), radius=3, start_angle=0, end_angle=90)
    doc.saveas(str(filepath))

    entities = parser.parse(str(filepath))

    assert len(entities.arcs) == 1
    arc = entities.arcs[0]
    assert arc.center == (5.0, 5.0)
    assert arc.radius == 3.0
    assert arc.start_angle == 0.0
    assert arc.end_angle == 90.0


def test_parse_text_entity(parser, tmp_path):
    """TEXT entities should be extracted with content and position."""
    filepath = tmp_path / "text.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_text("COCINA", dxfattribs={"insert": (2.0, 3.0), "height": 0.3})
    doc.saveas(str(filepath))

    entities = parser.parse(str(filepath))

    assert len(entities.texts) == 1
    text = entities.texts[0]
    assert text.content == "COCINA"
    assert text.position == (2.0, 3.0)
    assert text.text_type == "TEXT"


def test_parse_mtext_entity(parser, tmp_path):
    """MTEXT entities should have formatting stripped."""
    filepath = tmp_path / "mtext.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_mtext("\\H1.5;SALA", dxfattribs={"insert": (1.0, 1.0)})
    doc.saveas(str(filepath))

    entities = parser.parse(str(filepath))

    assert len(entities.texts) == 1
    text = entities.texts[0]
    assert "SALA" in text.content
    assert text.text_type == "MTEXT"


def test_parse_dimension_entity(parser, tmp_path):
    """DIMENSION entities should expose measurement text and position."""
    filepath = tmp_path / "dimension.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    dim = msp.add_linear_dim(base=(0, 5), p1=(0, 0), p2=(4.5, 0))
    dim.render()
    doc.saveas(str(filepath))

    entities = parser.parse(str(filepath))

    assert len(entities.dimensions) >= 1
    dimension = entities.dimensions[0]
    assert dimension.measurement_text
    # The rendered measurement reflects the actual 4.5 unit distance.
    assert abs(float(dimension.measurement_text) - 4.5) < 0.01


def test_parse_metadata(parser, tmp_path):
    """Metadata should include version, units, and extents."""
    filepath = tmp_path / "metadata.dxf"
    doc = ezdxf.new("R2010")
    doc.header["$INSUNITS"] = 6  # meters
    msp = doc.modelspace()
    msp.add_line((0, 0), (100, 50))
    doc.saveas(str(filepath))

    entities = parser.parse(str(filepath))

    assert entities.metadata.dxf_version == "AC1024"
    assert entities.metadata.units == "meters"
    assert entities.metadata.extents_min[0] <= entities.metadata.extents_max[0]
    assert entities.metadata.extents_min[1] <= entities.metadata.extents_max[1]


def test_parse_empty_dxf(parser, tmp_path):
    """An empty DXF should return empty entity lists."""
    filepath = tmp_path / "empty.dxf"
    doc = ezdxf.new("R2010")
    doc.saveas(str(filepath))

    entities = parser.parse(str(filepath))

    assert entities.polylines == []
    assert entities.lines == []
    assert entities.arcs == []
    assert entities.texts == []
    assert entities.dimensions == []
    assert entities.blocks == []


def test_parse_nonexistent_file(parser):
    """Parsing a missing file should raise FileNotFoundError."""
    with pytest.raises(FileNotFoundError):
        parser.parse("/nonexistent/path/file.dxf")


def test_detect_scale_from_insunits(tmp_path):
    """Scale should be derived from $INSUNITS for common units."""
    cases = [
        (6, 1.0),  # meters
        (5, 0.01),  # centimeters
        (4, 0.001),  # millimeters
        (2, 0.3048),  # feet
        (1, 0.0254),  # inches
    ]
    for units_code, expected in cases:
        filepath = tmp_path / f"units_{units_code}.dxf"
        doc = ezdxf.new("R2010")
        doc.header["$INSUNITS"] = units_code
        msp = doc.modelspace()
        msp.add_lwpolyline([(0, 0), (10, 0), (10, 10), (0, 10)], close=True)
        doc.saveas(str(filepath))

        entities = DxfParser().parse(str(filepath))
        scale = detect_scale(entities)
        assert abs(scale - expected) < 1e-9, f"units_code={units_code}"


def test_detect_scale_from_dimensions():
    """Scale should be inferred from dimension text vs geometric distance."""
    from app.services.dxf.parser import DimensionEntity, DxfEntities, DxfMetadata

    # Geometric distance from position to def_point is 10 drawing units.
    # Dimension says 5.0, so scale = 5.0 / 10 = 0.5.
    entities = DxfEntities(
        metadata=DxfMetadata(
            dxf_version="AC1024",
            units="unknown",
            extents_min=(0, 0),
            extents_max=(0, 0),
        ),
        dimensions=[
            DimensionEntity(
                measurement_text="5.0",
                position=(10, 0),
                def_point=(0, 0),
            ),
        ],
    )

    scale = detect_scale(entities)

    assert abs(scale - 0.5) < 0.01


def test_detect_scale_default(tmp_path):
    """Without units or dimensions, scale should default to 1.0."""
    filepath = tmp_path / "default.dxf"
    doc = ezdxf.new("R2010")
    # Do not set $INSUNITS and add no dimensions.
    msp = doc.modelspace()
    msp.add_line((0, 0), (1, 1))
    doc.saveas(str(filepath))

    entities = DxfParser().parse(str(filepath))
    assert detect_scale(entities) == 1.0


def test_parse_handles_corrupt_entities_gracefully(parser, tmp_path):
    """Corrupt or unsupported entities should not crash parsing."""
    filepath = tmp_path / "corrupt.dxf"
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_line((0, 0), (10, 0))
    msp.add_circle((5, 5), radius=2)  # Currently unsupported.
    doc.saveas(str(filepath))

    entities = parser.parse(str(filepath))

    assert len(entities.lines) == 1
