"""DWG to PNG converter — high resolution output for YOLOv8 training.

Usage:
    python scripts/dwg_to_png.py input.dwg [--dpi 300] [--output output.png]

Requirements:
    pip install ezdwg ezdxf pymupdf
"""

import argparse
import sys
from pathlib import Path


def dwg_to_dxf(dwg_path: str, dxf_path: str) -> bool:
    """Convert DWG to DXF using ezdwg."""
    try:
        import ezdwg

        print(f"  Reading DWG: {dwg_path}")
        result = ezdwg.to_dxf(
            dwg_path,
            dxf_path,
            dxf_version="R2010",
        )
        print(f"  DXF saved: {dxf_path}")
        return True
    except Exception as e:
        print(f"  Error converting DWG to DXF: {e}")
        return False


def dxf_to_png(dxf_path: str, png_path: str, dpi: int = 300) -> bool:
    """Convert DXF to PNG using ezdxf + PyMuPDF backend."""
    try:
        import ezdxf
        from ezdxf.addons.drawing import RenderContext, Frontend
        from ezdxf.addons.drawing.pymupdf import PyMuPdfBackend

        print(f"  Reading DXF: {dxf_path}")
        doc, auditor = ezdxf.recover.readfile(dxf_path)

        if auditor.has_errors:
            print(f"  Warning: DXF has {len(auditor.errors)} errors (continuing anyway)")

        # Get modelspace
        msp = doc.modelspace()

        # Calculate bounds for proper scaling
        bounds = _calculate_bounds(msp)
        if bounds:
            print(f"  Drawing bounds: {bounds}")

        # Create PyMuPDF backend
        backend = PyMuPdfBackend()

        # Render
        ctx = RenderContext(doc)
        frontend = Frontend(ctx, backend)
        frontend.draw_layout(msp)

        # Get PNG bytes with specified DPI
        page = backend.page
        png_bytes = backend.get_pixmap_bytes(page, fmt="png", dpi=dpi)

        # Save
        with open(png_path, "wb") as f:
            f.write(png_bytes)

        print(f"  PNG saved: {png_path} (DPI: {dpi})")
        return True

    except Exception as e:
        print(f"  Error converting DXF to PNG: {e}")
        import traceback
        traceback.print_exc()
        return False


def _calculate_bounds(msp):
    """Calculate bounding box of all entities in modelspace."""
    try:
        min_x = min_y = float("inf")
        max_x = max_y = float("-inf")

        for entity in msp:
            try:
                if hasattr(entity, "dxf"):
                    if hasattr(entity.dxf, "start"):
                        min_x = min(min_x, entity.dxf.start.x)
                        min_y = min(min_y, entity.dxf.start.y)
                        max_x = max(max_x, entity.dxf.start.x)
                        max_y = max(max_y, entity.dxf.start.y)
                    if hasattr(entity.dxf, "end"):
                        min_x = min(min_x, entity.dxf.end.x)
                        min_y = min(min_y, entity.dxf.end.y)
                        max_x = max(max_x, entity.dxf.end.x)
                        max_y = max(max_y, entity.dxf.end.y)
                    if hasattr(entity.dxf, "insert"):
                        min_x = min(min_x, entity.dxf.insert.x)
                        min_y = min(min_y, entity.dxf.insert.y)
                        max_x = max(max_x, entity.dxf.insert.x)
                        max_y = max(max_y, entity.dxf.insert.y)
            except Exception:
                continue

        if min_x == float("inf"):
            return None

        return {
            "min_x": round(min_x, 2),
            "min_y": round(min_y, 2),
            "max_x": round(max_x, 2),
            "max_y": round(max_y, 2),
            "width": round(max_x - min_x, 2),
            "height": round(max_y - min_y, 2),
        }
    except Exception:
        return None


def convert_dwg_to_png(dwg_path: str, output_path: str = None, dpi: int = 300) -> bool:
    """Full pipeline: DWG -> DXF -> PNG."""
    dwg = Path(dwg_path)

    if not dwg.exists():
        print(f"Error: File not found: {dwg_path}")
        return False

    # Default output path
    if output_path is None:
        output_path = str(dwg.with_suffix(".png"))

    dxf_temp = str(dwg.with_suffix(".dxf"))

    print(f"\n{'='*60}")
    print(f"DWG to PNG Converter")
    print(f"{'='*60}")
    print(f"  Input:  {dwg_path}")
    print(f"  Output: {output_path}")
    print(f"  DPI:    {dpi}")
    print(f"{'='*60}\n")

    # Step 1: DWG -> DXF
    print("[1/2] Converting DWG to DXF...")
    if not dwg_to_dxf(dwg_path, dxf_temp):
        return False

    # Step 2: DXF -> PNG
    print("\n[2/2] Converting DXF to PNG...")
    if not dxf_to_png(dxf_temp, output_path, dpi):
        return False

    # Verify output
    out = Path(output_path)
    if out.exists():
        size_kb = out.stat().st_size / 1024
        print(f"\n{'='*60}")
        print(f"SUCCESS!")
        print(f"  Output: {output_path}")
        print(f"  Size:   {size_kb:.1f} KB")
        print(f"{'='*60}")
        return True
    else:
        print(f"\nError: Output file was not created")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Convert DWG files to high-resolution PNG images"
    )
    parser.add_argument("input", help="Input DWG file path")
    parser.add_argument("--output", "-o", help="Output PNG file path (default: same name as input)")
    parser.add_argument("--dpi", type=int, default=300, help="Output DPI (default: 300)")

    args = parser.parse_args()

    success = convert_dwg_to_png(args.input, args.output, args.dpi)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
