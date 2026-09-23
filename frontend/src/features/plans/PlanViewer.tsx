import { useEffect, useRef, useCallback, useState } from 'react';
import * as fabric from 'fabric';
import { Download, Focus, ZoomIn } from 'lucide-react';
import type { DetectedSpace, Point } from '@shared/types/plan.types';
import { SPACE_TYPE_COLORS, SPACE_TYPE_LABELS } from '@shared/types/plan.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface PlanViewerProps {
  spaces: DetectedSpace[];
  backgroundImageUrl?: string;
  /** Meters per image pixel — places the PNG in the same coords as spaces. */
  metersPerPixel?: number | null;
  /** CAD drawings use Y-up (flip); raster PNGs use image Y-down (no flip). */
  flipY?: boolean;
  onSpaceSelect?: (space: DetectedSpace) => void;
  onSpaceEdit?: (spaceId: string, newVertices: Point[]) => void;
  mode?: 'view' | 'edit';
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const FIT_PADDING = 0.95;
const MIN_ZOOM_ABS = 0.01;
const MAX_ZOOM_ABS = 200;

function mapY(y: number, flipY: boolean): number {
  return flipY ? -y : y;
}

function computeBounds(spaces: DetectedSpace[], flipY: boolean): Bounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let found = false;

  for (const space of spaces) {
    if (!space.vertices || space.vertices.length < 3) continue;
    for (const v of space.vertices) {
      const y = mapY(v.y, flipY);
      if (v.x < minX) minX = v.x;
      if (y < minY) minY = y;
      if (v.x > maxX) maxX = v.x;
      if (y > maxY) maxY = y;
      found = true;
    }
  }

  if (!found) return null;
  if (maxX - minX < 1e-9) {
    maxX = minX + 1;
  }
  if (maxY - minY < 1e-9) {
    maxY = minY + 1;
  }
  return { minX, minY, maxX, maxY };
}

function buildFitTransform(
  bounds: Bounds,
  canvasW: number,
  canvasH: number,
): { transform: [number, number, number, number, number, number]; baseZoom: number } {
  const boundsW = bounds.maxX - bounds.minX;
  const boundsH = bounds.maxY - bounds.minY;
  const zoom = Math.min(canvasW / boundsW, canvasH / boundsH) * FIT_PADDING;
  const contentW = boundsW * zoom;
  const contentH = boundsH * zoom;
  const panX = (canvasW - contentW) / 2 - bounds.minX * zoom;
  const panY = (canvasH - contentH) / 2 - bounds.minY * zoom;
  return {
    transform: [zoom, 0, 0, zoom, panX, panY],
    baseZoom: zoom,
  };
}

export default function PlanViewer({
  spaces,
  backgroundImageUrl,
  metersPerPixel,
  flipY = true,
  onSpaceSelect,
  onSpaceEdit,
  mode = 'view',
}: PlanViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const baseZoomRef = useRef(1);
  const boundsRef = useRef<Bounds | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<DetectedSpace | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    space: DetectedSpace;
  } | null>(null);
  const [zoomPct, setZoomPct] = useState(100);

  const getColor = useCallback((spaceType: string | null) => {
    return SPACE_TYPE_COLORS[spaceType || 'unknown'] || SPACE_TYPE_COLORS.unknown;
  }, []);

  const updateZoomPct = useCallback((absoluteZoom: number) => {
    const base = baseZoomRef.current || 1;
    setZoomPct(Math.max(1, Math.round((absoluteZoom / base) * 100)));
  }, []);

  const applyFitToBounds = useCallback(() => {
    const canvas = fabricRef.current;
    const bounds = boundsRef.current;
    if (!canvas || !bounds) return;

    const { transform, baseZoom } = buildFitTransform(
      bounds,
      canvas.getWidth(),
      canvas.getHeight(),
    );
    baseZoomRef.current = baseZoom;
    canvas.setViewportTransform(transform);
    updateZoomPct(baseZoom);
    canvas.renderAll();
  }, [updateZoomPct]);

  // Init Fabric canvas once
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      selection: false,
      preserveObjectStacking: true,
      enableRetinaScaling: true,
      renderOnAddRemove: false,
    });

    fabricRef.current = canvas;

    canvas.on('mouse:wheel', (opt) => {
      const delta = (opt.e as WheelEvent).deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      const base = baseZoomRef.current || 1;
      const minZ = Math.max(MIN_ZOOM_ABS, base * 0.1);
      const maxZ = Math.min(MAX_ZOOM_ABS, base * 20);
      if (zoom > maxZ) zoom = maxZ;
      if (zoom < minZ) zoom = minZ;
      canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), zoom);
      updateZoomPct(zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    let isPanning = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on('mouse:down', (opt) => {
      const e = opt.e as MouseEvent;
      if (e.shiftKey || mode === 'view') {
        isPanning = true;
        lastPosX = e.clientX;
        lastPosY = e.clientY;
        canvas.setCursor('grab');
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isPanning) {
        const e = opt.e as MouseEvent;
        canvas.setCursor('grabbing');
        const deltaX = e.clientX - lastPosX;
        const deltaY = e.clientY - lastPosY;
        canvas.relativePan(new fabric.Point(deltaX, deltaY));
        lastPosX = e.clientX;
        lastPosY = e.clientY;
      }
    });

    canvas.on('mouse:up', () => {
      isPanning = false;
      canvas.setCursor('default');
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [mode, updateZoomPct]);

  // Responsive canvas size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = (width: number, height: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const w = Math.max(320, Math.floor(width));
      const h = Math.max(240, Math.floor(height));
      if (canvas.getWidth() === w && canvas.getHeight() === h) return;
      canvas.setDimensions({ width: w, height: h });
      applyFitToBounds();
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width <= 0 || height <= 0) continue;
        resize(width, height);
      }
    });

    observer.observe(container);
    resize(container.clientWidth || 800, container.clientHeight || 400);

    return () => observer.disconnect();
  }, [applyFitToBounds]);

  useEffect(() => {
    if (!fabricRef.current || !backgroundImageUrl) {
      if (fabricRef.current) {
        fabricRef.current.backgroundImage = undefined;
        fabricRef.current.requestRenderAll();
      }
      return;
    }

    const canvas = fabricRef.current;
    let cancelled = false;

    fabric.FabricImage.fromURL(backgroundImageUrl).then((img) => {
      if (cancelled || !fabricRef.current) return;
      const mpp = metersPerPixel && metersPerPixel > 0 ? metersPerPixel : null;
      if (mpp) {
        // Align PNG pixels with space meters (same origin as raster_parser).
        img.set({
          left: 0,
          top: 0,
          originX: 'left',
          originY: 'top',
          scaleX: mpp,
          scaleY: mpp,
          objectCaching: false,
        });
      } else {
        const scaleX = canvas.getWidth() / (img.width || 1);
        const scaleY = canvas.getHeight() / (img.height || 1);
        img.set({ scaleX, scaleY, objectCaching: false });
      }
      canvas.backgroundImage = img;
      canvas.requestRenderAll();
      applyFitToBounds();
    });

    return () => {
      cancelled = true;
    };
  }, [backgroundImageUrl, metersPerPixel, applyFitToBounds]);

  // Draw spaces + fit
  useEffect(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;

    const objects = canvas.getObjects();
    objects
      .filter((obj) => (obj as fabric.Polygon & { data?: { isSpace: boolean } }).data?.isSpace)
      .forEach((obj) => canvas.remove(obj));

    boundsRef.current = computeBounds(spaces, flipY);

    spaces.forEach((space) => {
      if (!space.vertices || space.vertices.length < 3) return;

      const points = space.vertices.map(
        (v) => new fabric.Point(v.x, mapY(v.y, flipY)),
      );
      const polygon = new fabric.Polygon(points, {
        fill: getColor(space.space_type),
        opacity: 0.4,
        stroke: getColor(space.space_type),
        strokeWidth: 1.25,
        strokeUniform: true,
        objectCaching: false,
        selectable: mode === 'edit',
        hoverCursor: 'pointer',
      });

      (polygon as fabric.Polygon & { data?: { isSpace: boolean; spaceId: string } }).data = {
        isSpace: true,
        spaceId: space.id,
      };

      polygon.on('mouseover', () => {
        polygon.set('opacity', 0.6);
        canvas.requestRenderAll();
      });

      polygon.on('mouseout', () => {
        polygon.set('opacity', 0.4);
        canvas.requestRenderAll();
        setTooltip(null);
      });

      polygon.on('mousedown', (opt) => {
        const e = opt.e as MouseEvent;
        if (!e.shiftKey) {
          setSelectedSpace(space);
          onSpaceSelect?.(space);

          const rect = canvas.getElement().getBoundingClientRect();
          setTooltip({
            x: rect.left + e.offsetX,
            y: rect.top + e.offsetY - 40,
            space,
          });
        }
      });

      if (mode === 'edit') {
        polygon.on('modified', () => {
          const poly = polygon as fabric.Polygon;
          const newPoints = poly.points;
          if (newPoints && onSpaceEdit) {
            const newVertices: Point[] = newPoints.map((p) => {
              const canvasY = p.y + (poly.top || 0) - (poly.pathOffset?.y || 0);
              return {
                x: p.x + (poly.left || 0) - (poly.pathOffset?.x || 0),
                y: flipY ? -canvasY : canvasY,
              };
            });
            onSpaceEdit(space.id, newVertices);
          }
        });
      }

      canvas.add(polygon);
    });

    applyFitToBounds();
  }, [spaces, mode, flipY, getColor, onSpaceSelect, onSpaceEdit, applyFitToBounds]);

  const handleExportPNG = useCallback(() => {
    if (!fabricRef.current) return;
    const dataURL = fabricRef.current.toDataURL({ multiplier: 2 });
    const link = document.createElement('a');
    link.download = 'plano.png';
    link.href = dataURL;
    link.click();
  }, []);

  const handleResetZoom = useCallback(() => {
    applyFitToBounds();
  }, [applyFitToBounds]);

  const handleZoomIn = useCallback(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    const base = baseZoomRef.current || 1;
    const maxZ = Math.min(MAX_ZOOM_ABS, base * 20);
    const zoom = Math.min(maxZ, canvas.getZoom() * 1.2);
    const center = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    canvas.zoomToPoint(center, zoom);
    updateZoomPct(zoom);
    canvas.requestRenderAll();
  }, [updateZoomPct]);

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleResetZoom}>
            <Focus className="size-4" />
            Reset zoom
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="size-4" />
            Acercar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleExportPNG}>
            <Download className="size-4" />
            Exportar PNG
          </Button>
          <Badge variant="secondary" className="ml-auto tabular-nums">
            {zoomPct}% · {mode === 'view' ? 'Vista' : 'Edición'}
          </Badge>
        </div>

        <div
          ref={containerRef}
          className="relative h-[min(70vw,560px)] min-h-[280px] w-full overflow-hidden rounded-lg border border-border bg-muted"
        >
          <canvas ref={canvasRef} className="block" />
        </div>

        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
            style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }}
          >
            <div className="font-medium">
              {SPACE_TYPE_LABELS[tooltip.space.space_type || 'unknown'] ||
                tooltip.space.name}
            </div>
            <div className="text-muted-foreground">
              {tooltip.space.area_m2.toFixed(1)} m²
            </div>
            <div className="text-xs text-muted-foreground">
              Confianza: {(tooltip.space.confidence * 100).toFixed(0)}%
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {Object.entries(SPACE_TYPE_COLORS)
            .filter(([key]) => spaces.some((s) => (s.space_type || 'unknown') === key))
            .map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="size-3 rounded-sm" style={{ backgroundColor: color }} />
                <span>{SPACE_TYPE_LABELS[type] || type}</span>
              </div>
            ))}
        </div>

        {selectedSpace && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
            <div className="font-medium text-foreground">
              {SPACE_TYPE_LABELS[selectedSpace.space_type || 'unknown'] ||
                selectedSpace.name}
            </div>
            <div className="mt-1 text-muted-foreground">
              Área: {selectedSpace.area_m2.toFixed(1)} m² · Perímetro:{' '}
              {selectedSpace.perimeter_m.toFixed(1)} m
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Confianza: {(selectedSpace.confidence * 100).toFixed(0)}% · Método:{' '}
              {selectedSpace.classification_method}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
