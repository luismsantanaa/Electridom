import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IaService, Consumption, Environment } from '../../services/ia.service';

interface CircuitElement {
  id: string;
  type: 'main' | 'branch' | 'load' | 'protection';
  x: number;
  y: number;
  label: string;
  rating?: string;
  color?: string;
}

@Component({
  selector: 'app-unifilar-svg',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unifilar-svg.component.html',
  styleUrls: ['./unifilar-svg.component.scss']
})
export class UnifilarSvgComponent implements OnInit {
  private iaService = inject(IaService);

  // Signals
  isLoading = signal(false);
  svgElements = signal<CircuitElement[]>([]);
  svgWidth = signal(800);
  svgHeight = signal(600);
  zoom = signal(1);

  // Datos de ejemplo
  sampleEnvironments: Environment[] = [
    { nombre: 'Sala', area_m2: 25, tipo: 'residencial' },
    { nombre: 'Cocina', area_m2: 15, tipo: 'residencial' },
    { nombre: 'Dormitorio', area_m2: 20, tipo: 'residencial' }
  ];

  sampleConsumptions: Consumption[] = [
    { nombre: 'Lámpara LED', ambiente: 'Sala', potencia_w: 15, tipo: 'iluminacion' },
    { nombre: 'TV Smart', ambiente: 'Sala', potencia_w: 120, tipo: 'entretenimiento' },
    { nombre: 'Refrigerador', ambiente: 'Cocina', potencia_w: 350, tipo: 'cocina' },
    { nombre: 'Aire Acondicionado', ambiente: 'Dormitorio', potencia_w: 1500, tipo: 'climatizacion' }
  ];

  ngOnInit() {
    this.generateUnifilarDiagram();
  }

  generateUnifilarDiagram() {
    this.isLoading.set(true);

    const elements: CircuitElement[] = [];

    // Alimentador principal
    elements.push({
      id: 'main-feeder',
      type: 'main',
      x: 400,
      y: 50,
      label: 'Alimentador Principal',
      rating: '100A - 240V',
      color: '#2E86AB'
    });

    // Interruptor principal
    elements.push({
      id: 'main-breaker',
      type: 'protection',
      x: 400,
      y: 100,
      label: 'Interruptor Principal',
      rating: '100A',
      color: '#A23B72'
    });

    // Circuitos derivados
    let yOffset = 150;
    this.sampleEnvironments.forEach((env, index) => {
      const x = 200 + (index * 200);

      // Interruptor derivado
      elements.push({
        id: `breaker-${index}`,
        type: 'protection',
        x: x,
        y: yOffset,
        label: `Interruptor ${env.nombre}`,
        rating: '20A',
        color: '#F18F01'
      });

      // Cargas del ambiente
      const envConsumptions = this.sampleConsumptions.filter(c => c.ambiente === env.nombre);
      envConsumptions.forEach((consumption, cIndex) => {
        elements.push({
          id: `load-${index}-${cIndex}`,
          type: 'load',
          x: x,
          y: yOffset + 50 + (cIndex * 30),
          label: consumption.nombre,
          rating: `${consumption.potencia_w}W`,
          color: '#C73E1D'
        });
      });

      yOffset += 50 + (envConsumptions.length * 30);
    });

    this.svgElements.set(elements);
    this.svgHeight.set(Math.max(600, yOffset + 50));
    this.isLoading.set(false);
  }

  // Métodos de zoom
  zoomIn() {
    this.zoom.update(current => Math.min(current * 1.2, 3));
  }

  zoomOut() {
    this.zoom.update(current => Math.max(current / 1.2, 0.5));
  }

  resetZoom() {
    this.zoom.set(1);
  }

  // Exportar diagrama
  exportAsSVG() {
    const svgElement = document.querySelector('.unifilar-svg') as SVGElement;
    if (svgElement) {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'diagrama-unifilar.svg';
      link.click();
      
      URL.revokeObjectURL(url);
    }
  }

  exportAsPNG() {
    const svgElement = document.querySelector('.unifilar-svg') as SVGElement;
    if (svgElement) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = this.svgWidth() * this.zoom();
        canvas.height = this.svgHeight() * this.zoom();
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = 'diagrama-unifilar.png';
        link.click();
        
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    }
  }

  // Obtener clases CSS para elementos
  getElementClass(element: CircuitElement): string {
    return `circuit-element ${element.type}-element`;
  }

  // Obtener estilos para elementos
  getElementStyle(element: CircuitElement): string {
    return `transform: translate(${element.x}px, ${element.y}px) scale(${this.zoom()});`;
  }
}
