import { Injectable } from '@angular/core';
import { CircuitoResultado, ProyectoResultado } from './export.service';

export interface UnifilarNode {
  id: number;
  x: number;
  y: number;
  label: string;
  type: 'panel' | 'circuit' | 'load';
  data?: any;
}

export interface UnifilarConnection {
  from: number;
  to: number;
  label?: string;
}

export interface UnifilarDiagram {
  nodes: UnifilarNode[];
  connections: UnifilarConnection[];
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root'
})
export class UnifilarService {

  constructor() {}

  /**
   * Genera un diagrama unifilar SVG avanzado para HU15.2
   */
  generateUnifilar(proyecto: ProyectoResultado): string {
    const diagram = this.createUnifilarDiagram(proyecto);
    return this.generateAdvancedSVG(diagram);
  }

  /**
   * Exporta el diagrama unifilar como SVG para HU15.2
   */
  exportUnifilarAsSVG(proyecto: ProyectoResultado): string {
    const svg = this.generateUnifilar(proyecto);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `unifilar-${proyecto.nombre.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return svg;
  }

  /**
   * Crea la estructura del diagrama unifilar
   */
  private createUnifilarDiagram(proyecto: ProyectoResultado): UnifilarDiagram {
    const nodes: UnifilarNode[] = [];
    const connections: UnifilarConnection[] = [];
    
    // Panel principal
    nodes.push({
      id: 0,
      x: 100,
      y: 50,
      label: 'Panel Principal',
      type: 'panel',
      data: { potencia: proyecto.circuitos.reduce((sum, c) => sum + c.potenciaVA, 0) }
    });
    
    // Circuitos
    const circuitosPorFila = 3;
    const espaciadoX = 150;
    const espaciadoY = 120;
    
    proyecto.circuitos.forEach((circuito, index) => {
      const fila = Math.floor(index / circuitosPorFila);
      const columna = index % circuitosPorFila;
      
      const x = 100 + columna * espaciadoX;
      const y = 150 + fila * espaciadoY;
      
      // Nodo del circuito
      nodes.push({
        id: circuito.id,
        x: x,
        y: y,
        label: `C${circuito.id}`,
        type: 'circuit',
        data: circuito
      });
      
      // Conexión desde el panel
      connections.push({
        from: 0,
        to: circuito.id,
        label: `${circuito.proteccion.capacidadA}A`
      });
      
      // Carga del circuito
      nodes.push({
        id: circuito.id * 1000, // ID único para cargas
        x: x,
        y: y + 60,
        label: `${circuito.ambienteNombre}\n${circuito.tipo}`,
        type: 'load',
        data: circuito
      });
      
      // Conexión del circuito a la carga
      connections.push({
        from: circuito.id,
        to: circuito.id * 1000
      });
    });
    
    // Calcular dimensiones
    const maxX = Math.max(...nodes.map(n => n.x)) + 100;
    const maxY = Math.max(...nodes.map(n => n.y)) + 100;
    
    return {
      nodes,
      connections,
      width: maxX,
      height: maxY
    };
  }

  /**
   * Genera el SVG avanzado del diagrama unifilar para HU15.2
   */
  private generateAdvancedSVG(diagram: UnifilarDiagram): string {
    const svg = `
      <svg width="${diagram.width}" height="${diagram.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .node { fill: white; stroke: #333; stroke-width: 2; }
            .node-panel { fill: #e3f2fd; stroke: #1976d2; }
            .node-circuit { fill: #fff3e0; stroke: #f57c00; }
            .node-load { fill: #f3e5f5; stroke: #7b1fa2; }
            .connection { stroke: #333; stroke-width: 2; fill: none; }
            .label { font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; }
            .label-panel { font-weight: bold; font-size: 14px; }
            .label-circuit { font-weight: bold; }
            .label-load { font-size: 10px; }
            .connection-label { font-family: Arial, sans-serif; font-size: 10px; fill: #666; }
            .power-label { fill: #e74c3c; font-family: Arial, sans-serif; font-size: 10px; text-anchor: middle; font-weight: bold; }
            .current-label { fill: #3498db; font-family: Arial, sans-serif; font-size: 10px; text-anchor: middle; font-weight: bold; }
            .protection { fill: #f39c12; stroke: #e67e22; stroke-width: 2; }
            .conductor { fill: #9b59b6; stroke: #8e44ad; stroke-width: 2; }
            .grid { stroke: #ecf0f1; stroke-width: 1; opacity: 0.3; }
          </style>
        </defs>
        
        <!-- Grid de fondo -->
        ${this.generateGridSVG(diagram.width, diagram.height)}
        
        <!-- Título del diagrama -->
        <text x="${diagram.width/2}" y="30" text-anchor="middle" style="font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #2c3e50;">Diagrama Unifilar Avanzado</text>
        
        <!-- Conexiones -->
        ${diagram.connections.map(conn => this.generateConnectionSVG(conn, diagram.nodes)).join('\n')}
        
        <!-- Nodos -->
        ${diagram.nodes.map(node => this.generateAdvancedNodeSVG(node)).join('\n')}
        
        <!-- Leyenda -->
        ${this.generateLegendSVG(diagram.width, diagram.height)}
      </svg>
    `;
    
    return svg;
  }

  /**
   * Genera el SVG del diagrama unifilar (método original)
   */
  private generateSVG(diagram: UnifilarDiagram): string {
    const svg = `
      <svg width="${diagram.width}" height="${diagram.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .node { fill: white; stroke: #333; stroke-width: 2; }
            .node-panel { fill: #e3f2fd; stroke: #1976d2; }
            .node-circuit { fill: #fff3e0; stroke: #f57c00; }
            .node-load { fill: #f3e5f5; stroke: #7b1fa2; }
            .connection { stroke: #333; stroke-width: 2; fill: none; }
            .label { font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; }
            .label-panel { font-weight: bold; font-size: 14px; }
            .label-circuit { font-weight: bold; }
            .label-load { font-size: 10px; }
            .connection-label { font-family: Arial, sans-serif; font-size: 10px; fill: #666; }
          </style>
        </defs>
        
        <!-- Conexiones -->
        ${diagram.connections.map(conn => this.generateConnectionSVG(conn, diagram.nodes)).join('\n')}
        
        <!-- Nodos -->
        ${diagram.nodes.map(node => this.generateNodeSVG(node)).join('\n')}
      </svg>
    `;
    
    return svg;
  }

  /**
   * Genera el SVG de un nodo
   */
  private generateNodeSVG(node: UnifilarNode): string {
    let width = 80;
    let height = 40;
    let rx = 5;
    
    // Ajustar tamaño según el tipo
    switch (node.type) {
      case 'panel':
        width = 120;
        height = 60;
        rx = 8;
        break;
      case 'load':
        width = 100;
        height = 50;
        rx = 6;
        break;
    }
    
    const x = node.x - width / 2;
    const y = node.y - height / 2;
    
    return `
      <rect 
        x="${x}" y="${y}" 
        width="${width}" height="${height}" 
        rx="${rx}" 
        class="node node-${node.type}"
      />
      <text x="${node.x}" y="${node.y + 4}" class="label label-${node.type}">
        ${this.escapeHtml(node.label)}
      </text>
      ${this.generateNodeDetailsSVG(node)}
    `;
  }

  /**
   * Genera detalles adicionales del nodo
   */
  private generateNodeDetailsSVG(node: UnifilarNode): string {
    if (node.type === 'circuit' && node.data) {
      const circuito = node.data as CircuitoResultado;
      return `
        <text x="${node.x}" y="${node.y + 20}" class="label label-circuit" font-size="10">
          ${circuito.proteccion.capacidadA}A
        </text>
        <text x="${node.x}" y="${node.y + 32}" class="label label-circuit" font-size="8">
          ${circuito.conductor.calibreAWG}
        </text>
      `;
    }
    
    if (node.type === 'panel' && node.data) {
      const potencia = node.data.potencia;
      return `
        <text x="${node.x}" y="${node.y + 25}" class="label label-panel" font-size="10">
          ${potencia.toLocaleString()} VA
        </text>
      `;
    }
    
    return '';
  }

  /**
   * Genera el SVG de una conexión
   */
  private generateConnectionSVG(connection: UnifilarConnection, nodes: UnifilarNode[]): string {
    const fromNode = nodes.find(n => n.id === connection.from);
    const toNode = nodes.find(n => n.id === connection.to);
    
    if (!fromNode || !toNode) return '';
    
    // Calcular puntos de conexión
    const fromPoint = this.getConnectionPoint(fromNode, toNode);
    const toPoint = this.getConnectionPoint(toNode, fromNode);
    
    // Crear línea
    const line = `
      <line 
        x1="${fromPoint.x}" y1="${fromPoint.y}" 
        x2="${toPoint.x}" y2="${toPoint.y}" 
        class="connection"
      />
    `;
    
    // Agregar etiqueta si existe
    if (connection.label) {
      const midX = (fromPoint.x + toPoint.x) / 2;
      const midY = (fromPoint.y + toPoint.y) / 2;
      
      return `
        ${line}
        <text x="${midX}" y="${midY - 5}" class="connection-label">
          ${this.escapeHtml(connection.label)}
        </text>
      `;
    }
    
    return line;
  }

  /**
   * Calcula el punto de conexión de un nodo hacia otro
   */
  private getConnectionPoint(node: UnifilarNode, targetNode: UnifilarNode): { x: number, y: number } {
    const dx = targetNode.x - node.x;
    const dy = targetNode.y - node.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return { x: node.x, y: node.y };
    
    // Calcular el radio del nodo según su tipo
    let radius = 20;
    switch (node.type) {
      case 'panel':
        radius = 30;
        break;
      case 'load':
        radius = 25;
        break;
    }
    
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;
    
    return {
      x: node.x + normalizedDx * radius,
      y: node.y + normalizedDy * radius
    };
  }

  /**
   * Escapa caracteres HTML especiales
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Genera el grid de fondo para el SVG avanzado
   */
  private generateGridSVG(width: number, height: number): string {
    let grid = '';
    for (let i = 0; i <= width; i += 50) {
      grid += `<line x1="${i}" y1="0" x2="${i}" y2="${height}" class="grid"/>`;
    }
    for (let i = 0; i <= height; i += 50) {
      grid += `<line x1="0" y1="${i}" x2="${width}" y2="${i}" class="grid"/>`;
    }
    return grid;
  }

  /**
   * Genera la leyenda para el SVG avanzado
   */
  private generateLegendSVG(width: number, height: number): string {
    const legendY = height - 80;
    let legend = `<text x="50" y="${legendY}" style="font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #2c3e50;">Leyenda:</text>`;
    
    // Elementos de la leyenda
    legend += `<rect x="42" y="${legendY + 15}" width="16" height="16" rx="3" class="node-panel"/>`;
    legend += `<text x="70" y="${legendY + 27}" style="font-family: Arial, sans-serif; font-size: 12px; fill: #333;">Panel</text>`;
    
    legend += `<rect x="42" y="${legendY + 35}" width="16" height="16" rx="3" class="node-circuit"/>`;
    legend += `<text x="70" y="${legendY + 47}" style="font-family: Arial, sans-serif; font-size: 12px; fill: #333;">Circuito</text>`;
    
    legend += `<rect x="42" y="${legendY + 55}" width="16" height="16" rx="3" class="node-load"/>`;
    legend += `<text x="70" y="${legendY + 67}" style="font-family: Arial, sans-serif; font-size: 12px; fill: #333;">Carga</text>`;
    
    return legend;
  }

  /**
   * Genera el SVG avanzado de un nodo
   */
  private generateAdvancedNodeSVG(node: UnifilarNode): string {
    let width = 80;
    let height = 40;
    let rx = 5;
    
    // Ajustar tamaño según el tipo
    switch (node.type) {
      case 'panel':
        width = 120;
        height = 60;
        rx = 8;
        break;
      case 'load':
        width = 100;
        height = 50;
        rx = 6;
        break;
    }
    
    const x = node.x - width / 2;
    const y = node.y - height / 2;
    
    let svg = `
      <rect 
        x="${x}" y="${y}" 
        width="${width}" height="${height}" 
        rx="${rx}" 
        class="node node-${node.type}"
      />
      <text x="${node.x}" y="${node.y + 4}" class="label label-${node.type}">
        ${this.escapeHtml(node.label)}
      </text>
    `;
    
    // Agregar detalles avanzados según el tipo
    if (node.type === 'circuit' && node.data) {
      const circuito = node.data as CircuitoResultado;
      svg += `
        <text x="${node.x}" y="${node.y + 20}" class="power-label">
          ${circuito.potenciaVA}VA
        </text>
        <text x="${node.x}" y="${node.y + 32}" class="current-label">
          ${circuito.corrienteA}A
        </text>
      `;
    }
    
    if (node.type === 'panel' && node.data) {
      const potencia = node.data.potencia;
      svg += `
        <text x="${node.x}" y="${node.y + 25}" class="power-label">
          ${potencia.toLocaleString()} VA
        </text>
      `;
    }
    
    return svg;
  }

  /**
   * Genera un diagrama unifilar simplificado para proyectos grandes
   */
  generateSimplifiedUnifilar(proyecto: ProyectoResultado): string {
    const circuitosAgrupados = this.groupCircuitsByType(proyecto.circuitos);
    const diagram = this.createSimplifiedDiagram(proyecto, circuitosAgrupados);
    return this.generateSVG(diagram);
  }

  /**
   * Agrupa circuitos por tipo
   */
  private groupCircuitsByType(circuitos: CircuitoResultado[]): Map<string, CircuitoResultado[]> {
    const grouped = new Map<string, CircuitoResultado[]>();
    
    circuitos.forEach(circuito => {
      const key = circuito.tipo;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(circuito);
    });
    
    return grouped;
  }

  /**
   * Crea un diagrama simplificado
   */
  private createSimplifiedDiagram(proyecto: ProyectoResultado, circuitosAgrupados: Map<string, CircuitoResultado[]>): UnifilarDiagram {
    const nodes: UnifilarNode[] = [];
    const connections: UnifilarConnection[] = [];
    
    // Panel principal
    nodes.push({
      id: 0,
      x: 100,
      y: 50,
      label: 'Panel Principal',
      type: 'panel',
      data: { potencia: proyecto.circuitos.reduce((sum, c) => sum + c.potenciaVA, 0) }
    });
    
    // Grupos de circuitos
    let index = 0;
    circuitosAgrupados.forEach((circuitos, tipo) => {
      const x = 100 + (index % 2) * 200;
      const y = 150 + Math.floor(index / 2) * 120;
      
      // Nodo del grupo
      nodes.push({
        id: index + 1,
        x: x,
        y: y,
        label: `${tipo}\n(${circuitos.length} circuitos)`,
        type: 'circuit',
        data: { tipo, circuitos }
      });
      
      // Conexión desde el panel
      connections.push({
        from: 0,
        to: index + 1,
        label: `${circuitos.length}`
      });
      
      index++;
    });
    
    return {
      nodes,
      connections,
      width: 400,
      height: 200 + Math.ceil(index / 2) * 120
    };
  }
}
