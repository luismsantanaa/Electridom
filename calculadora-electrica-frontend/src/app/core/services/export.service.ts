import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface CircuitoResultado {
  id: number;
  ambienteId: number;
  ambienteNombre: string;
  tipo: string;
  potenciaVA: number;
  corrienteA: number;
  proteccion: {
    tipo: string;
    capacidadA: number;
    curva: string;
  };
  conductor: {
    calibreAWG: string;
    material: string;
    capacidadA: number;
  };
}

export interface ProyectoResultado {
  id: number;
  nombre: string;
  circuitos: CircuitoResultado[];
  unifilarSvg?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() {}

  /**
   * Exporta los resultados a PDF
   */
  async toPDF(proyecto: ProyectoResultado): Promise<void> {
    const doc = new jsPDF();
    
    // Configuración inicial
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Calculadora Eléctrica', 105, 20, { align: 'center' });
    
    // Logo (si existe)
    // doc.addImage(logoBase64, 'PNG', 10, 10, 30, 30);
    
    // Información del proyecto
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Proyecto: ${proyecto.nombre}`, 20, 40);
    doc.text(`ID: ${proyecto.id}`, 20, 50);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 60);
    
    // Tabla de circuitos
    const circuitosData = proyecto.circuitos.map(circuito => [
      circuito.ambienteNombre,
      circuito.tipo,
      `${circuito.potenciaVA} VA`,
      `${circuito.corrienteA.toFixed(1)} A`,
      `${circuito.proteccion.tipo} ${circuito.proteccion.capacidadA}A ${circuito.proteccion.curva}`,
      `${circuito.conductor.calibreAWG} ${circuito.conductor.material}`
    ]);
    
    (doc as any).autoTable({
      startY: 80,
      head: [['Ambiente', 'Tipo', 'Potencia', 'Corriente', 'Protección', 'Conductor']],
      body: circuitosData,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8
      }
    });
    
    // Unifilar (si existe)
    if (proyecto.unifilarSvg) {
      const unifilarY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Diagrama Unifilar:', 20, unifilarY);
      
      // Convertir SVG a imagen y agregar al PDF
      try {
        const canvas = await this.svgToCanvas(proyecto.unifilarSvg);
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 20, unifilarY + 10, 170, 100);
      } catch (error) {
        console.error('Error al convertir SVG:', error);
        doc.text('Error al generar diagrama unifilar', 20, unifilarY + 20);
      }
    }
    
    // Pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Página ${i} de ${pageCount}`, 105, 280, { align: 'center' });
    }
    
    // Descargar el PDF
    doc.save(`proyecto-${proyecto.id}-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * Exporta los resultados a Excel
   */
  toExcel(proyecto: ProyectoResultado): void {
    const workbook = XLSX.utils.book_new();
    
    // Hoja de Circuitos
    const circuitosData = proyecto.circuitos.map(circuito => ({
      'Ambiente': circuito.ambienteNombre,
      'Tipo': circuito.tipo,
      'Potencia (VA)': circuito.potenciaVA,
      'Corriente (A)': circuito.corrienteA,
      'Protección Tipo': circuito.proteccion.tipo,
      'Protección Capacidad (A)': circuito.proteccion.capacidadA,
      'Protección Curva': circuito.proteccion.curva,
      'Conductor Calibre': circuito.conductor.calibreAWG,
      'Conductor Material': circuito.conductor.material,
      'Conductor Capacidad (A)': circuito.conductor.capacidadA
    }));
    
    const circuitosSheet = XLSX.utils.json_to_sheet(circuitosData);
    XLSX.utils.book_append_sheet(workbook, circuitosSheet, 'Circuitos');
    
    // Hoja de Resumen
    const resumenData = [
      { 'Campo': 'Nombre del Proyecto', 'Valor': proyecto.nombre },
      { 'Campo': 'ID del Proyecto', 'Valor': proyecto.id },
      { 'Campo': 'Total de Circuitos', 'Valor': proyecto.circuitos.length },
      { 'Campo': 'Potencia Total (VA)', 'Valor': proyecto.circuitos.reduce((sum, c) => sum + c.potenciaVA, 0) },
      { 'Campo': 'Corriente Total (A)', 'Valor': proyecto.circuitos.reduce((sum, c) => sum + c.corrienteA, 0).toFixed(1) },
      { 'Campo': 'Fecha de Exportación', 'Valor': new Date().toLocaleDateString('es-ES') }
    ];
    
    const resumenSheet = XLSX.utils.json_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen');
    
    // Hoja de Protecciones (agrupadas)
    const proteccionesMap = new Map<string, number>();
    proyecto.circuitos.forEach(circuito => {
      const key = `${circuito.proteccion.tipo} ${circuito.proteccion.capacidadA}A ${circuito.proteccion.curva}`;
      proteccionesMap.set(key, (proteccionesMap.get(key) || 0) + 1);
    });
    
    const proteccionesData = Array.from(proteccionesMap.entries()).map(([proteccion, cantidad]) => ({
      'Protección': proteccion,
      'Cantidad': cantidad
    }));
    
    const proteccionesSheet = XLSX.utils.json_to_sheet(proteccionesData);
    XLSX.utils.book_append_sheet(workbook, proteccionesSheet, 'Protecciones');
    
    // Descargar el Excel
    XLSX.writeFile(workbook, `proyecto-${proyecto.id}-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  /**
   * Convierte SVG a Canvas para usar en PDF
   */
  private async svgToCanvas(svgString: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Convertir SVG a data URL
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error al cargar SVG'));
      };
      
      img.src = url;
    });
  }

  /**
   * Exporta solo el diagrama unifilar como imagen
   */
  async exportUnifilarAsImage(svgString: string, filename: string): Promise<void> {
    try {
      const canvas = await this.svgToCanvas(svgString);
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error al exportar unifilar:', error);
      throw error;
    }
  }
}
