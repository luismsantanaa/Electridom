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
  onSpaceSelect?: (space: DetectedSpace) => void;
  onSpaceEdit?: (spaceId: string, newVertices: Point[]) => void;
  mode?: 'view' | 'edit';
}

export default function PlanViewer({
  spaces,
  backgroundImageUrl,
  onSpaceSelect,
  onSpaceEdit,
  mode = 'view',
}: PlanViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
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

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      selection: false,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    canvas.on('mouse:wheel', (opt) => {
      const delta = (opt.e as WheelEvent).deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.1) zoom = 0.1;
      canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), zoom);
      setZoomPct(Math.round(zoom * 100));
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
    };
  }, [mode]);

  useEffect(() => {
    if (!fabricRef.current || !backgroundImageUrl) return;

    const canvas = fabricRef.current;
    fabric.FabricImage.fromURL(backgroundImageUrl).then((img) => {
      canvas.backgroundImage = img;
      const scaleX = canvas.getWidth() / (img.width || 1);
      const scaleY = canvas.getHeight() / (img.height || 1);
      img.set({ scaleX, scaleY });
      canvas.renderAll();
    });
  }, [backgroundImageUrl]);

  useEffect(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;

    const objects = canvas.getObjects();
    objects
      .filter((obj) => (obj as fabric.Polygon & { data?: { isSpace: boolean } }).data?.isSpace)
      .forEach((obj) => canvas.remove(obj));

    spaces.forEach((space) => {
      if (!space.vertices || space.vertices.length < 3) return;

      const points = space.vertices.map((v) => new fabric.Point(v.x, v.y));
      const polygon = new fabric.Polygon(points, {
        fill: getColor(space.space_type),
        opacity: 0.4,
        stroke: getColor(space.space_type),
        strokeWidth: 2,
        selectable: mode === 'edit',
        hoverCursor: 'pointer',
      });

      (polygon as fabric.Polygon & { data?: { isSpace: boolean; spaceId: string } }).data = {
        isSpace: true,
        spaceId: space.id,
      };

      polygon.on('mouseover', () => {
        polygon.set('opacity', 0.6);
        canvas.renderAll();
      });

      polygon.on('mouseout', () => {
        polygon.set('opacity', 0.4);
        canvas.renderAll();
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
            const newVertices: Point[] = newPoints.map((p) => ({
              x: p.x + (poly.left || 0),
              y: p.y + (poly.top || 0),
            }));
            onSpaceEdit(space.id, newVertices);
          }
        });
      }

      canvas.add(polygon);
    });

    canvas.renderAll();
  }, [spaces, mode, getColor, onSpaceSelect, onSpaceEdit]);

  const handleExportPNG = useCallback(() => {
    if (!fabricRef.current) return;
    const dataURL = fabricRef.current.toDataURL({ multiplier: 2 });
    const link = document.createElement('a');
    link.download = 'plano.png';
    link.href = dataURL;
    link.click();
  }, []);

  const handleResetZoom = useCallback(() => {
    if (!fabricRef.current) return;
    fabricRef.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoomPct(100);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    const zoom = Math.min(20, canvas.getZoom() * 1.2);
    canvas.setZoom(zoom);
    setZoomPct(Math.round(zoom * 100));
    canvas.renderAll();
  }, []);

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

        <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
          <canvas ref={canvasRef} width={800} height={600} className="w-full" />
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
