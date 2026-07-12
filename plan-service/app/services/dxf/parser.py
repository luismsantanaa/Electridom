"""DXF parser — extracts entities from DXF files using ezdxf.

TODO (Fase 3): Implement full parsing of LWPOLYLINE, LINE, ARC, TEXT, DIMENSION entities.
"""


class DxfParser:
    """Parses DXF files and extracts relevant entities."""

    def parse(self, file_path: str) -> dict:
        """Extract all relevant entities from a DXF file.

        Returns a dictionary with:
        - polylines: list of LWPOLYLINE entities
        - lines: list of LINE segments
        - arcs: list of ARC entities
        - texts: list of TEXT/MTEXT entities
        - dimensions: list of DIMENSION entities
        - metadata: DXF file metadata (version, units, extents)
        """
        raise NotImplementedError("DXF parser will be implemented in Fase 3")
