import { useEffect, useRef, useCallback, useState } from 'react';
import * as fabric from 'fabric';
import type { DetectedSpace, Point } from '@shared/types/plan.types';
import { SPACE_TYPE_COLORS, SPACE_TYPE_LABELS } from '@shared/types/plan.types';

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
  const [tooltip, setTooltip] = useState<{ x: number; y: number; space: DetectedSpace } | null>(null);

  const getColor = useCallback((spaceType: string | null) => {
    return SPACE_TYPE_COLORS[spaceType || 'unknown'] || SPACE_TYPE_COLORS.unknown;
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      selection: false,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    // Zoom with mouse wheel
    canvas.on('mouse:wheel', (opt) => {
      const delta = (opt.e as WheelEvent).deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.1) zoom = 0.1;
      canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Pan with drag
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

  // Load background image
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

  // Render spaces as polygons
  useEffect(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;

    // Remove existing polygons
    const objects = canvas.getObjects();
    objects
      .filter((obj) => (obj as fabric.Polygon & { data?: { isSpace: boolean } }).data?.isSpace)
      .forEach((obj) => canvas.remove(obj));

    // Add new polygons
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
  }, []);

  return (
    <div className="relative">
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleResetZoom}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Reset Zoom
        </button>
        <button
          onClick={handleExportPNG}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Exportar PNG
        </button>
        <span className="px-3 py-1 text-sm text-gray-500">
          Modo: {mode === 'view' ? 'Vista' : 'Edición'}
        </span>
      </div>

      <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
        <canvas ref={canvasRef} width={800} height={600} className="w-full" />
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }}
        >
          <div className="font-medium">
            {SPACE_TYPE_LABELS[tooltip.space.space_type || 'unknown'] || tooltip.space.name}
          </div>
          <div className="text-gray-500">{tooltip.space.area_m2.toFixed(1)} m²</div>
          <div className="text-xs text-gray-400">
            Confianza: {(tooltip.space.confidence * 100).toFixed(0)}%
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {Object.entries(SPACE_TYPE_COLORS)
          .filter(([key]) => spaces.some((s) => (s.space_type || 'unknown') === key))
          .map(([type, color]) => (
            <div key={type} className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="text-gray-600">{SPACE_TYPE_LABELS[type] || type}</span>
            </div>
          ))}
      </div>

      {/* Selected space info */}
      {selectedSpace && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div className="font-medium text-blue-900">
            {SPACE_TYPE_LABELS[selectedSpace.space_type || 'unknown'] || selectedSpace.name}
          </div>
          <div className="text-blue-700">
            Área: {selectedSpace.area_m2.toFixed(1)} m² | Perímetro:{' '}
            {selectedSpace.perimeter_m.toFixed(1)} m
          </div>
          <div className="text-blue-500 text-xs">
            Confianza: {(selectedSpace.confidence * 100).toFixed(0)}% | Método:{' '}
            {selectedSpace.classification_method}
          </div>
        </div>
      )}
    </div>
  );
}
