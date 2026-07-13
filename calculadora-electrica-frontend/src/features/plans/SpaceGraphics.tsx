import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import type { DetectedSpace } from '@shared/types/plan.types';
import { SPACE_TYPE_COLORS, SPACE_TYPE_LABELS } from '@shared/types/plan.types';

interface SpaceGraphicsProps {
  spaces: DetectedSpace[];
  onSpaceSelect?: (space: DetectedSpace) => void;
  viewMode?: 'treemap' | 'bubble';
}

interface SpaceDatum {
  space: DetectedSpace;
  value: number;
}

export default function SpaceGraphics({
  spaces,
  onSpaceSelect,
  viewMode = 'treemap',
}: SpaceGraphicsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({ width: Math.max(400, width), height: Math.max(300, width * 0.6) });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const getColor = useCallback((spaceType: string | null) => {
    return SPACE_TYPE_COLORS[spaceType || 'unknown'] || SPACE_TYPE_COLORS.unknown;
  }, []);

  useEffect(() => {
    if (!svgRef.current || spaces.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const innerWidth = width - 20;
    const innerHeight = height - 20;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(10,10)');

    const data: SpaceDatum[] = spaces.map((s) => ({
      space: s,
      value: s.area_m2 || 1,
    }));

    if (viewMode === 'treemap') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const root: any = d3
        .hierarchy({ children: data } as any)
        .sum((d: any) => d.value || 0)
        .sort((a: any, b: any) => (b.value || 0) - (a.value || 0));

      d3.treemap().size([innerWidth, innerHeight]).padding(2).round(true)(root);

      const leaves = root.leaves() as any[];

      const cells = g
        .selectAll('g')
        .data(leaves)
        .enter()
        .append('g')
        .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`)
        .style('cursor', 'pointer')
        .on('click', (_: any, d: any) => {
          if (d.data?.space) onSpaceSelect?.(d.data.space);
        });

      cells
        .append('rect')
        .attr('width', (d: any) => Math.max(0, d.x1 - d.x0))
        .attr('height', (d: any) => Math.max(0, d.y1 - d.y0))
        .attr('fill', (d: any) => getColor(d.data?.space?.space_type ?? null))
        .attr('opacity', 0.7)
        .attr('rx', 4)
        .on('mouseover', function () {
          d3.select(this).attr('opacity', 1);
        })
        .on('mouseout', function () {
          d3.select(this).attr('opacity', 0.7);
        });

      cells
        .append('text')
        .attr('x', (d: any) => (d.x1 - d.x0) / 2)
        .attr('y', (d: any) => (d.y1 - d.y0) / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text((d: any) => {
          const w = d.x1 - d.x0;
          const h = d.y1 - d.y0;
          if (w < 40 || h < 30 || !d.data?.space) return '';
          return SPACE_TYPE_LABELS[d.data.space.space_type || 'unknown'] || d.data.space.name;
        });

      cells
        .append('text')
        .attr('x', (d: any) => (d.x1 - d.x0) / 2)
        .attr('y', (d: any) => (d.y1 - d.y0) / 2 + 14)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '9px')
        .attr('opacity', 0.8)
        .text((d: any) => {
          const w = d.x1 - d.x0;
          const h = d.y1 - d.y0;
          if (w < 40 || h < 45 || !d.data?.space) return '';
          return `${d.data.space.area_m2.toFixed(1)} m²`;
        });
    } else {
      // Bubble chart
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const root: any = d3
        .hierarchy({ children: data } as any)
        .sum((d: any) => d.value || 0)
        .sort((a: any, b: any) => (b.value || 0) - (a.value || 0));

      d3.pack().size([innerWidth, innerHeight]).padding(4)(root);

      const leaves = root.leaves() as any[];

      const circles = g
        .selectAll('g')
        .data(leaves)
        .enter()
        .append('g')
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
        .style('cursor', 'pointer')
        .on('click', (_: any, d: any) => {
          if (d.data?.space) onSpaceSelect?.(d.data.space);
        });

      circles
        .append('circle')
        .attr('r', (d: any) => d.r)
        .attr('fill', (d: any) => getColor(d.data?.space?.space_type ?? null))
        .attr('opacity', 0.7)
        .on('mouseover', function () {
          d3.select(this).attr('opacity', 1);
        })
        .on('mouseout', function () {
          d3.select(this).attr('opacity', 0.7);
        });

      circles
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text((d: any) => {
          if (d.r < 25 || !d.data?.space) return '';
          return SPACE_TYPE_LABELS[d.data.space.space_type || 'unknown'] || d.data.space.name;
        });

      circles
        .append('text')
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '9px')
        .attr('opacity', 0.8)
        .text((d: any) => {
          if (d.r < 35 || !d.data?.space) return '';
          return `${d.data.space.area_m2.toFixed(1)} m²`;
        });
    }
  }, [spaces, dimensions, viewMode, getColor, onSpaceSelect]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} className="w-full border border-gray-200 rounded-lg bg-white" />
    </div>
  );
}
