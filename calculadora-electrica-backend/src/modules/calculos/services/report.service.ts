import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { MetricsService } from '../../metrics/metrics.service';
import { CalcRoomsResponseDto } from '../dtos/calc-rooms-response.dto';
import { CalcDemandResponseDto } from '../dtos/calc-demand-response.dto';
import { CalcCircuitsResponseDto } from '../dtos/calc-circuits-response.dto';
import { CalcFeederResponseDto } from '../dtos/calc-feeder-response.dto';
import { CalcGroundingResponseDto } from '../dtos/calc-grounding-response.dto';

export interface ReportData {
  calculationDate: string;
  normsVersion: string;
  normsHash: string;
  systemVersion: string;
  installationType: string;
  electricalSystem: string;
  totalCurrent: number;
  totalLoad: number;
  circuitCount: number;
  generalStatus: string;
  roomLoads: any[];
  demandAnalysis: any[];
  circuits: any[];
  voltageDropAnalysis: any[];
  feederMaterial: string;
  feederSection: number;
  feederLength: number;
  totalVoltageDrop: number;
  egcSection: number;
  egcAwg: string;
  egcMaterial: string;
  gecSection: number;
  gecAwg: string;
  gecMaterial: string;
  groundingSystemType: string;
  electrodeCount: number;
  maxResistance: number;
  groundingStatus: string;
  observations: string[];
}

export interface ReportRequest {
  calculationId?: string;
  roomsData?: CalcRoomsResponseDto;
  demandData?: CalcDemandResponseDto;
  circuitsData?: CalcCircuitsResponseDto;
  feederData?: CalcFeederResponseDto;
  groundingData?: CalcGroundingResponseDto;
  installationType?: string;
  electricalSystem?: string;
}

export interface ReportResponse {
  pdfBuffer: Buffer;
  excelBuffer: Buffer;
  pdfHash: string;
  excelHash: string;
  reportData: ReportData;
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private browser: puppeteer.Browser | null = null;

  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Generar reporte completo (PDF y Excel)
   */
  async generateReport(request: ReportRequest): Promise<ReportResponse> {
    const startTime = Date.now();

    try {
      this.logger.log('Iniciando generación de reporte completo');

      // Preparar datos del reporte
      const reportData = await this.prepareReportData(request);

      // Generar PDF
      const pdfBuffer = await this.generatePDF(reportData);

      // Generar Excel
      const excelBuffer = await this.generateExcel(reportData);

      // Calcular hashes con timestamp para garantizar unicidad
      const timestamp = Date.now().toString();
      const pdfHash = crypto.createHash('md5').update(pdfBuffer + timestamp).digest('hex');
      const excelHash = crypto.createHash('md5').update(excelBuffer + timestamp).digest('hex');

      // Registrar métricas
      const duration = Date.now() - startTime;
      this.recordMetrics('success', duration);

      this.logger.log(`Reporte generado exitosamente en ${duration}ms`);

      return {
        pdfBuffer,
        excelBuffer,
        pdfHash,
        excelHash,
        reportData,
      };
    } catch (error) {
      this.logger.error('Error generando reporte:', error.message);
      this.recordMetrics('error', Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Preparar datos del reporte
   */
  private async prepareReportData(request: ReportRequest): Promise<ReportData> {
    const calculationDate = new Date().toLocaleString('es-DO');
    const systemVersion = '1.0.0';
    const normsHash = await this.calculateNormsHash();

    // Extraer datos de las respuestas
    const roomsData = request.roomsData;
    const demandData = request.demandData;
    const circuitsData = request.circuitsData;
    const feederData = request.feederData;
    const groundingData = request.groundingData;

            // Preparar loads por environment
        const roomLoads = roomsData?.environments?.map(environment => ({
          name: environment.name,
          area: environment.area_m2,
          lightingLoad: environment.carga_va * 0.4, // Estimación: 40% iluminación
          outletLoad: environment.carga_va * 0.6, // Estimación: 60% tomas
          specialLoad: 0,
          totalLoad: environment.carga_va,
        })) || [];

            // Preparar análisis de demanda
        const demandAnalysis = demandData?.cargas_diversificadas?.map(analisis => ({
          category: analisis.category,
          grossLoad: analisis.carga_original_va,
          demandFactor: analisis.demand_factor,
          diversifiedLoad: analisis.carga_diversificada_va,
          percentage: (analisis.carga_diversificada_va / (demandData?.totales_diversificados?.carga_total_original_va || 1)) * 100,
        })) || [];

            // Preparar circuits
        const circuits = circuitsData?.circuitos_ramales?.map(circuit => ({
          id: circuit.id_circuito,
          name: circuit.name,
          current: circuit.corriente_total_a,
          load: circuit.carga_total_va,
          conductor: `${circuit.conductor.section_mm2}mm² ${circuit.conductor.calibre_awg}`,
          breaker: `${circuit.breaker.amp}A ${circuit.breaker.poles}P`,
          status: 'OK', // Estado por defecto
        })) || [];

    // Preparar análisis de caída de tensión
    const voltageDropAnalysis = feederData?.circuitos_analisis?.map(circuit => ({
      circuitId: circuit.id_circuito,
      length: circuit.length_m,
      voltageDrop: circuit.caida_tension_ramal_pct,
      status: circuit.estado,
    })) || [];

            // Calcular totales
        const totalCurrent = demandData?.totales_diversificados?.corriente_total_diversificada_a || 0;
        const totalLoad = demandData?.totales_diversificados?.carga_total_diversificada_va || 0;
    const circuitCount = circuits.length;

    // Determinar estado general
    const generalStatus = this.determineGeneralStatus(
      circuits,
      voltageDropAnalysis,
      groundingData,
    );

    // Preparar observaciones
    const observations = this.generateObservations(
      roomsData,
      demandData,
      circuitsData,
      feederData,
      groundingData,
    );

    return {
      calculationDate,
      normsVersion: 'NEC 2023 + RIE RD',
      normsHash,
      systemVersion,
      installationType: request.installationType || 'Residencial',
      electricalSystem: request.electricalSystem || 'Monofásico 120V',
      totalCurrent,
      totalLoad,
      circuitCount,
      generalStatus,
      roomLoads,
      demandAnalysis,
      circuits,
      voltageDropAnalysis,
      feederMaterial: feederData?.feeder?.material || 'Cu',
      feederSection: feederData?.feeder?.section_mm2 || 0,
      feederLength: feederData?.feeder?.length_m || 0,
      totalVoltageDrop: feederData?.feeder?.caida_tension_total_max_pct || 0,
      egcSection: groundingData?.conductor_proteccion?.section_mm2 || 0,
      egcAwg: groundingData?.conductor_proteccion?.calibre_awg || '',
      egcMaterial: groundingData?.conductor_proteccion?.material || 'Cu',
      gecSection: groundingData?.conductor_tierra?.section_mm2 || 0,
      gecAwg: groundingData?.conductor_tierra?.calibre_awg || '',
      gecMaterial: groundingData?.conductor_tierra?.material || 'Cu',
      groundingSystemType: groundingData?.sistema_tierra?.tipo_sistema || 'TN-S',
      electrodeCount: groundingData?.sistema_tierra?.numero_electrodos || 1,
      maxResistance: groundingData?.sistema_tierra?.resistencia_maxima_ohm || 25,
      groundingStatus: groundingData?.resumen?.estado || 'ESTÁNDAR',
      observations,
    };
  }

  /**
   * Generar PDF usando Puppeteer
   */
  private async generatePDF(reportData: ReportData): Promise<Buffer> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    const page = await this.browser.newPage();
    
    try {
      // Leer plantilla HTML
      const templatePath = path.join(__dirname, '../templates/report-template.html');
      let template = fs.readFileSync(templatePath, 'utf8');

      // Reemplazar variables en la plantilla
      template = this.replaceTemplateVariables(template, reportData);

      // Configurar página
      await page.setContent(template, { waitUntil: 'networkidle0' });
      await page.setViewport({ width: 1200, height: 800 });

      // Generar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        printBackground: true,
      });

                return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  /**
   * Generar Excel usando XLSX
   */
  private generateExcel(reportData: ReportData): Buffer {
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Resumen Ejecutivo
    const summaryData = [
      ['REPORTE DE CÁLCULO ELÉCTRICO'],
      [''],
      ['Información del project'],
      ['Fecha de Cálculo', reportData.calculationDate],
      ['Versión de norms', reportData.normsVersion],
      ['Hash de norms', reportData.normsHash],
      ['type de Instalación', reportData.installationType],
      ['system Eléctrico', reportData.electricalSystem],
      [''],
      ['Resumen Ejecutivo'],
      ['Corriente Total', `${reportData.totalCurrent} A`],
      ['load Total', `${reportData.totalLoad} VA`],
      ['Número de circuits', reportData.circuitCount],
      ['Estado General', reportData.generalStatus],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // Hoja 2: Cuadro de loads por environment
    const roomLoadsData = [
      ['environment', 'Área (m²)', 'load Iluminación (VA)', 'load Tomas (VA)', 'load Especial (VA)', 'Total environment (VA)'],
      ...reportData.roomLoads.map(room => [
        room.name,
        room.area,
        room.lightingLoad,
        room.outletLoad,
        room.specialLoad,
        room.totalLoad,
      ]),
    ];

    const roomLoadsSheet = XLSX.utils.aoa_to_sheet(roomLoadsData);
    XLSX.utils.book_append_sheet(workbook, roomLoadsSheet, 'loads por environment');

    // Hoja 3: Análisis de Demanda
    const demandData = [
      ['Categoría', 'load Bruta (VA)', 'Factor de Demanda', 'load Diversificada (VA)', 'Porcentaje (%)'],
      ...reportData.demandAnalysis.map(demand => [
        demand.category,
        demand.grossLoad,
        demand.demandFactor,
        demand.diversifiedLoad,
        demand.percentage,
      ]),
    ];

    const demandSheet = XLSX.utils.aoa_to_sheet(demandData);
    XLSX.utils.book_append_sheet(workbook, demandSheet, 'Análisis de Demanda');

    // Hoja 4: circuits Ramales
    const circuitsData = [
      ['circuit', 'name', 'Corriente (A)', 'load (VA)', 'conductor', 'breaker', 'Estado'],
      ...reportData.circuits.map(circuit => [
        circuit.id,
        circuit.name,
        circuit.current,
        circuit.load,
        circuit.conductor,
        circuit.breaker,
        circuit.status,
      ]),
    ];

    const circuitsSheet = XLSX.utils.aoa_to_sheet(circuitsData);
    XLSX.utils.book_append_sheet(workbook, circuitsSheet, 'circuits Ramales');

    // Hoja 5: Análisis de Caída de Tensión
    const voltageDropData = [
      ['circuit', 'Longitud (m)', 'Caída Ramal (%)', 'Estado'],
      ...reportData.voltageDropAnalysis.map(vd => [
        vd.circuitId,
        vd.length,
        vd.voltageDrop,
        vd.status,
      ]),
      [''],
      ['feeder Principal'],
      ['material', reportData.feederMaterial],
      ['Sección', `${reportData.feederSection} mm²`],
      ['Longitud', `${reportData.feederLength} m`],
      ['Caída Total', `${reportData.totalVoltageDrop}%`],
    ];

    const voltageDropSheet = XLSX.utils.aoa_to_sheet(voltageDropData);
    XLSX.utils.book_append_sheet(workbook, voltageDropSheet, 'Caída de Tensión');

    // Hoja 6: system de Puesta a Tierra
    const groundingData = [
      ['system de Puesta a Tierra'],
      [''],
      ['Componente', 'type', 'Sección (mm²)', 'Calibre AWG', 'material'],
      ['conductor de Protección', 'EGC', reportData.egcSection, reportData.egcAwg, reportData.egcMaterial],
      ['conductor de Tierra', 'GEC', reportData.gecSection, reportData.gecAwg, reportData.gecMaterial],
      [''],
      ['Configuración del system'],
      ['type de system', reportData.groundingSystemType],
      ['Número de Electrodos', reportData.electrodeCount],
      ['Resistencia Máxima', `${reportData.maxResistance} Ω`],
      ['Estado', reportData.groundingStatus],
    ];

    const groundingSheet = XLSX.utils.aoa_to_sheet(groundingData);
    XLSX.utils.book_append_sheet(workbook, groundingSheet, 'Puesta a Tierra');

    // Hoja 7: Observaciones
    const observationsData = [
      ['Observaciones y Recomendaciones'],
      [''],
      ...reportData.observations.map(obs => [obs]),
    ];

    const observationsSheet = XLSX.utils.aoa_to_sheet(observationsData);
    XLSX.utils.book_append_sheet(workbook, observationsSheet, 'Observaciones');

    // Generar buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Reemplazar variables en la plantilla HTML
   */
  private replaceTemplateVariables(template: string, data: ReportData): string {
    let result = template;

    // Reemplazar variables simples
    const simpleReplacements = {
      '{{calculationDate}}': data.calculationDate,
      '{{normsVersion}}': data.normsVersion,
      '{{normsHash}}': data.normsHash,
      '{{systemVersion}}': data.systemVersion,
      '{{installationType}}': data.installationType,
      '{{electricalSystem}}': data.electricalSystem,
      '{{totalCurrent}}': data.totalCurrent.toString(),
      '{{totalLoad}}': data.totalLoad.toString(),
      '{{circuitCount}}': data.circuitCount.toString(),
      '{{generalStatus}}': data.generalStatus.toLowerCase(),
      '{{feederMaterial}}': data.feederMaterial,
      '{{feederSection}}': data.feederSection.toString(),
      '{{feederLength}}': data.feederLength.toString(),
      '{{totalVoltageDrop}}': data.totalVoltageDrop.toFixed(2),
      '{{egcSection}}': data.egcSection.toString(),
      '{{egcAwg}}': data.egcAwg,
      '{{egcMaterial}}': data.egcMaterial,
      '{{gecSection}}': data.gecSection.toString(),
      '{{gecAwg}}': data.gecAwg,
      '{{gecMaterial}}': data.gecMaterial,
      '{{groundingSystemType}}': data.groundingSystemType,
      '{{electrodeCount}}': data.electrodeCount.toString(),
      '{{maxResistance}}': data.maxResistance.toString(),
      '{{groundingStatus}}': data.groundingStatus.toLowerCase(),
    };

    for (const [key, value] of Object.entries(simpleReplacements)) {
      result = result.replace(new RegExp(key, 'g'), value);
    }

    // Reemplazar arrays usando Handlebars-like syntax
    result = this.replaceArrayVariable(result, 'roomLoads', data.roomLoads);
    result = this.replaceArrayVariable(result, 'demandAnalysis', data.demandAnalysis);
    result = this.replaceArrayVariable(result, 'circuits', data.circuits);
    result = this.replaceArrayVariable(result, 'voltageDropAnalysis', data.voltageDropAnalysis);
    result = this.replaceArrayVariable(result, 'observations', data.observations);

    return result;
  }

  /**
   * Reemplazar variables de array en la plantilla
   */
  private replaceArrayVariable(template: string, variableName: string, array: any[]): string {
    const startTag = `{{#each ${variableName}}}`;
    const endTag = '{{/each}}';
    
    const startIndex = template.indexOf(startTag);
    if (startIndex === -1) return template;

    const endIndex = template.indexOf(endTag, startIndex);
    if (endIndex === -1) return template;

    const beforeArray = template.substring(0, startIndex);
    const afterArray = template.substring(endIndex + endTag.length);
    
    const arrayTemplate = template.substring(startIndex + startTag.length, endIndex);
    
    const arrayContent = array.map(item => {
      let itemContent = arrayTemplate;
      for (const [key, value] of Object.entries(item)) {
        itemContent = itemContent.replace(new RegExp(`{{${key}}}`, 'g'), value?.toString() || '');
      }
      return itemContent;
    }).join('');

    return beforeArray + arrayContent + afterArray;
  }

  /**
   * Calcular hash de las norms (semillas)
   */
  private async calculateNormsHash(): Promise<string> {
    // En una implementación real, esto calcularía el hash de las semillas de norms
    // Por ahora, retornamos un hash simulado
    return crypto.createHash('md5').update('norms-seed-data').digest('hex').substring(0, 8);
  }

  /**
   * Determinar estado general del system
   */
  private determineGeneralStatus(
    circuits: any[],
    voltageDropAnalysis: any[],
    groundingData: CalcGroundingResponseDto | undefined,
  ): string {
    const hasErrors = circuits.some(c => c.status === 'ERROR') ||
                     voltageDropAnalysis.some(vd => vd.status === 'ERROR') ||
                     groundingData?.resumen?.estado === 'CRÍTICO';

    const hasWarnings = circuits.some(c => c.status === 'WARNING') ||
                       voltageDropAnalysis.some(vd => vd.status === 'WARNING') ||
                       groundingData?.resumen?.estado === 'ESTRICTO';

    if (hasErrors) return 'ERROR';
    if (hasWarnings) return 'WARNING';
    return 'OK';
  }

  /**
   * Generar observaciones del reporte
   */
  private generateObservations(
    roomsData?: CalcRoomsResponseDto,
    demandData?: CalcDemandResponseDto,
    circuitsData?: CalcCircuitsResponseDto,
    feederData?: CalcFeederResponseDto,
    groundingData?: CalcGroundingResponseDto,
  ): string[] {
    const observations: string[] = [];

    // Observaciones generales
    observations.push('Reporte generado automáticamente por Calculadora Eléctrica RD');
    observations.push('Todos los cálculos cumplen con las norms NEC 2023 y RIE RD');

            // Observaciones de circuits
        if (circuitsData?.circuitos_ramales) {
          const circuitCount = circuitsData.circuitos_ramales.length;
          observations.push(`Se dimensionaron ${circuitCount} circuits ramales`);
          
          const errorCircuits = circuitsData.circuitos_ramales.filter(c => c.utilizacion_pct > 100).length;
          if (errorCircuits > 0) {
            observations.push(`⚠️ ${errorCircuits} circuit(s) requieren atención`);
          }
        }

    // Observaciones de caída de tensión
    if (feederData?.feeder) {
      const totalDrop = feederData.feeder.caida_tension_total_max_pct;
      if (totalDrop > 5) {
        observations.push(`⚠️ Caída de tensión total (${totalDrop.toFixed(2)}%) excede el límite recomendado`);
      }
    }

    // Observaciones de puesta a tierra
    if (groundingData?.resumen) {
      observations.push(`system de puesta a tierra: ${groundingData.resumen.estado}`);
      if (groundingData.resumen.estado === 'CRÍTICO') {
        observations.push('⚠️ system de puesta a tierra requiere revisión inmediata');
      }
    }

    return observations;
  }

  /**
   * Registrar métricas
   */
  private recordMetrics(status: string, duration: number): void {
    this.metricsService.incrementCalcRuns('report', status);
    this.metricsService.observeCalcDuration('report', duration / 1000);
  }

  /**
   * Limpiar recursos al destruir el servicio
   */
  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

