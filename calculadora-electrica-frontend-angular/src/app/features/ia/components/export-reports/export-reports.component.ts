import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { IaService, Consumption, Environment, CalcResponse } from '../../services/ia.service';

interface ReportData {
  title: string;
  date: string;
  environments: Environment[];
  consumptions: Consumption[];
  calculations?: CalcResponse;
}

@Component({
  selector: 'app-export-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './export-reports.component.html',
  styleUrls: ['./export-reports.component.scss']
})
export class ExportReportsComponent implements OnInit {
  private iaService = inject(IaService);
  
  // Hacer Object disponible en el template
  protected readonly Object = Object;

  // Signals
  isLoading = signal(false);
  reportData = signal<ReportData | null>(null);
  selectedFormat = signal<'pdf' | 'excel'>('pdf');
  includeCharts = signal(true);
  includeCalculations = signal(true);

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
    { nombre: 'Microondas', ambiente: 'Cocina', potencia_w: 1100, tipo: 'cocina' },
    { nombre: 'Aire Acondicionado', ambiente: 'Dormitorio', potencia_w: 1500, tipo: 'climatizacion' }
  ];

  ngOnInit() {
    this.prepareReportData();
  }

  prepareReportData() {
    this.reportData.set({
      title: 'Reporte de Cálculos Eléctricos - Electridom',
      date: new Date().toLocaleDateString('es-DO'),
      environments: this.sampleEnvironments,
      consumptions: this.sampleConsumptions
    });
  }

  async generateReport() {
    this.isLoading.set(true);

    try {
      if (this.selectedFormat() === 'pdf') {
        await this.generatePDF();
      } else {
        await this.generateExcel();
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async generatePDF() {
    const doc = new jsPDF();
    const data = this.reportData();

    if (!data) return;

    // Título
    doc.setFontSize(20);
    doc.text('ELECTRIDOM', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('Reporte de Cálculos Eléctricos', 105, 35, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Fecha: ${data.date}`, 20, 50);

    let yPosition = 70;

    // Sección de Ambientes
    doc.setFontSize(14);
    doc.text('Ambientes', 20, yPosition);
    yPosition += 10;

    const environmentData = data.environments.map(env => [
      env.nombre,
      `${env.area_m2} m²`,
      env.tipo
    ]);

    autoTable(doc, {
      head: [['Ambiente', 'Área', 'Tipo']],
      body: environmentData,
      startY: yPosition,
      theme: 'grid'
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Sección de Consumos
    doc.setFontSize(14);
    doc.text('Consumos Eléctricos', 20, yPosition);
    yPosition += 10;

    const consumptionData = data.consumptions.map(cons => [
      cons.nombre,
      cons.ambiente,
      cons.tipo,
      `${cons.potencia_w} W`
    ]);

    autoTable(doc, {
      head: [['Dispositivo', 'Ambiente', 'Tipo', 'Potencia']],
      body: consumptionData,
      startY: yPosition,
      theme: 'grid'
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Resumen
    const totalPower = data.consumptions.reduce((sum, cons) => sum + cons.potencia_w, 0);
    const totalArea = data.environments.reduce((sum, env) => sum + env.area_m2, 0);

    doc.setFontSize(14);
    doc.text('Resumen', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.text(`Total de Potencia: ${totalPower} W`, 20, yPosition);
    yPosition += 8;
    doc.text(`Área Total: ${totalArea} m²`, 20, yPosition);
    yPosition += 8;
    doc.text(`Densidad de Carga: ${(totalPower / totalArea).toFixed(2)} W/m²`, 20, yPosition);

    // Pie de página
    doc.setFontSize(10);
    doc.text('Generado por Electridom - Sistema de Cálculos Eléctricos', 105, 280, { align: 'center' });

    // Guardar PDF
    doc.save('reporte-electridom.pdf');
  }

  private async generateExcel() {
    const data = this.reportData();
    if (!data) return;

    const workbook = XLSX.utils.book_new();

    // Hoja de Ambientes
    const environmentData = [
      ['Ambiente', 'Área (m²)', 'Tipo'],
      ...data.environments.map(env => [env.nombre, env.area_m2, env.tipo])
    ];
    const environmentSheet = XLSX.utils.aoa_to_sheet(environmentData);
    XLSX.utils.book_append_sheet(workbook, environmentSheet, 'Ambientes');

    // Hoja de Consumos
    const consumptionData = [
      ['Dispositivo', 'Ambiente', 'Tipo', 'Potencia (W)'],
      ...data.consumptions.map(cons => [cons.nombre, cons.ambiente, cons.tipo, cons.potencia_w])
    ];
    const consumptionSheet = XLSX.utils.aoa_to_sheet(consumptionData);
    XLSX.utils.book_append_sheet(workbook, consumptionSheet, 'Consumos');

    // Hoja de Resumen
    const totalPower = data.consumptions.reduce((sum, cons) => sum + cons.potencia_w, 0);
    const totalArea = data.environments.reduce((sum, env) => sum + env.area_m2, 0);
    
    const summaryData = [
      ['Métrica', 'Valor'],
      ['Total de Potencia (W)', totalPower],
      ['Área Total (m²)', totalArea],
      ['Densidad de Carga (W/m²)', (totalPower / totalArea).toFixed(2)],
      ['Fecha de Generación', data.date]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // Guardar Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'reporte-electridom.xlsx');
  }

  // Métodos auxiliares
  getTotalPower(): number {
    return this.sampleConsumptions.reduce((sum, cons) => sum + cons.potencia_w, 0);
  }

  getTotalArea(): number {
    return this.sampleEnvironments.reduce((sum, env) => sum + env.area_m2, 0);
  }

  getPowerDensity(): number {
    const totalPower = this.getTotalPower();
    const totalArea = this.getTotalArea();
    return totalArea > 0 ? totalPower / totalArea : 0;
  }

  getConsumptionByType(): { [key: string]: number } {
    return this.sampleConsumptions.reduce((acc, cons) => {
      acc[cons.tipo] = (acc[cons.tipo] || 0) + cons.potencia_w;
      return acc;
    }, {} as { [key: string]: number });
  }
}
