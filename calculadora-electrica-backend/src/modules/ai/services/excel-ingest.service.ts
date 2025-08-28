import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

export interface ExcelRow {
  [key: string]: any;
}

export interface ProcessedData {
  system: {
    voltage: number;
    phases: 1 | 3;
    frequency: number;
  };
  superficies: Array<{
    name: string;
    area: number;
    type: string;
  }>;
  consumos: Array<{
    name: string;
    power: number;
    quantity: number;
    type: string;
  }>;
}

@Injectable()
export class ExcelIngestService {
  private readonly logger = new Logger(ExcelIngestService.name);
  private readonly ajv = new Ajv({ allErrors: true });

  constructor() {}

  /**
   * Procesa un archivo Excel y lo normaliza al schema de entrada
   */
  async processExcelFile(filePath: string): Promise<{
    success: boolean;
    data?: ProcessedData;
    message: string;
    errors?: string[];
    rowsProcessed: number;
    rowsWithErrors: number;
  }> {
    try {
      this.logger.log(`Procesando archivo Excel: ${filePath}`);

      // Leer el archivo Excel
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (!jsonData || jsonData.length < 2) {
        throw new BadRequestException('El archivo Excel debe tener al menos una fila de encabezados y una fila de datos');
      }

      // Procesar los datos
      const result = this.processExcelData(jsonData);

      // Limpiar archivo temporal
      this.cleanupTempFile(filePath);

      return result;

    } catch (error) {
      this.logger.error(`Error procesando archivo Excel: ${error.message}`);
      
      // Limpiar archivo temporal en caso de error
      this.cleanupTempFile(filePath);

      return {
        success: false,
        message: `Error procesando archivo: ${error.message}`,
        errors: [error.message],
        rowsProcessed: 0,
        rowsWithErrors: 0
      };
    }
  }

  /**
   * Procesa los datos del Excel y los normaliza
   */
  private processExcelData(jsonData: any[][]): {
    success: boolean;
    data?: ProcessedData;
    message: string;
    errors?: string[];
    rowsProcessed: number;
    rowsWithErrors: number;
  } {
    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);
    const errors: string[] = [];
    let rowsWithErrors = 0;

    // Validar estructura de encabezados
    const requiredHeaders = ['name', 'type', 'value', 'unit'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return {
        success: false,
        message: `Encabezados requeridos faltantes: ${missingHeaders.join(', ')}`,
        errors: [`Encabezados requeridos: ${requiredHeaders.join(', ')}`],
        rowsProcessed: 0,
        rowsWithErrors: 0
      };
    }

    // Procesar filas de datos
    const processedData: ProcessedData = {
      system: { voltage: 120, phases: 1, frequency: 60 }, // Valores por defecto
      superficies: [],
      consumos: []
    };

    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque empezamos desde la fila 2 (después de encabezados)
      
      try {
        const rowData = this.parseRow(headers, row);
        
        if (rowData) {
          this.addToProcessedData(processedData, rowData, rowNumber, errors);
        }
      } catch (error) {
        errors.push(`Fila ${rowNumber}: ${error.message}`);
        rowsWithErrors++;
      }
    });

    // Validar datos procesados
    const validationResult = this.validateProcessedData(processedData);
    if (!validationResult.isValid) {
      errors.push(...validationResult.errors);
      rowsWithErrors += validationResult.errors.length;
    }

    const success = errors.length === 0;
    const message = success 
      ? `Archivo procesado exitosamente. ${dataRows.length} filas procesadas.`
      : `Procesamiento completado con ${errors.length} errores.`;

    return {
      success,
      data: success ? processedData : undefined,
      message,
      errors: errors.length > 0 ? errors : undefined,
      rowsProcessed: dataRows.length,
      rowsWithErrors
    };
  }

  /**
   * Parsea una fila de datos del Excel
   */
  private parseRow(headers: string[], row: any[]): any {
    const rowData: any = {};
    
    headers.forEach((header, index) => {
      if (row[index] !== undefined && row[index] !== null && row[index] !== '') {
        rowData[header] = row[index];
      }
    });

    // Validar que la fila tenga datos mínimos
    if (!rowData.name || !rowData.type) {
      throw new Error('Fila debe tener al menos "name" y "type"');
    }

    return rowData;
  }

  /**
   * Agrega datos procesados a la estructura final
   */
  private addToProcessedData(
    processedData: ProcessedData, 
    rowData: any, 
    rowNumber: number, 
    errors: string[]
  ): void {
    const { name, type, value, unit } = rowData;

    switch (type.toLowerCase()) {
      case 'system':
        this.processSystemData(processedData, name, value, unit, rowNumber, errors);
        break;
      case 'superficie':
      case 'ambiente':
        this.processSuperficieData(processedData, name, value, unit, rowNumber, errors);
        break;
      case 'consumo':
      case 'carga':
        this.processConsumoData(processedData, name, value, unit, rowNumber, errors);
        break;
      default:
        errors.push(`Fila ${rowNumber}: Tipo desconocido "${type}". Tipos válidos: system, superficie, consumo`);
    }
  }

  /**
   * Procesa datos del sistema
   */
  private processSystemData(
    processedData: ProcessedData,
    name: string,
    value: any,
    unit: string,
    rowNumber: number,
    errors: string[]
  ): void {
    const numValue = this.parseNumber(value, rowNumber, errors);
    if (numValue === null) return;

    switch (name.toLowerCase()) {
      case 'voltage':
      case 'tension':
        processedData.system.voltage = numValue;
        break;
      case 'phases':
      case 'fases':
        if (numValue !== 1 && numValue !== 3) {
          errors.push(`Fila ${rowNumber}: Fases debe ser 1 o 3`);
          return;
        }
        processedData.system.phases = numValue as 1 | 3;
        break;
      case 'frequency':
      case 'frecuencia':
        processedData.system.frequency = numValue;
        break;
      default:
        errors.push(`Fila ${rowNumber}: Propiedad de sistema desconocida "${name}"`);
    }
  }

  /**
   * Procesa datos de superficies/ambientes
   */
  private processSuperficieData(
    processedData: ProcessedData,
    name: string,
    value: any,
    unit: string,
    rowNumber: number,
    errors: string[]
  ): void {
    const area = this.parseNumber(value, rowNumber, errors);
    if (area === null) return;

    processedData.superficies.push({
      name: name,
      area: area,
      type: 'residencial' // Valor por defecto
    });
  }

  /**
   * Procesa datos de consumos/cargas
   */
  private processConsumoData(
    processedData: ProcessedData,
    name: string,
    value: any,
    unit: string,
    rowNumber: number,
    errors: string[]
  ): void {
    const power = this.parseNumber(value, rowNumber, errors);
    if (power === null) return;

    processedData.consumos.push({
      name: name,
      power: power,
      quantity: 1, // Valor por defecto
      type: 'iluminacion' // Valor por defecto
    });
  }

  /**
   * Parsea un valor numérico
   */
  private parseNumber(value: any, rowNumber: number, errors: string[]): number | null {
    const num = Number(value);
    if (isNaN(num)) {
      errors.push(`Fila ${rowNumber}: Valor "${value}" no es un número válido`);
      return null;
    }
    return num;
  }

  /**
   * Valida los datos procesados contra el schema
   */
  private validateProcessedData(data: ProcessedData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validaciones básicas
    if (data.system.voltage <= 0) {
      errors.push('Voltaje del sistema debe ser mayor a 0');
    }

    if (data.system.frequency <= 0) {
      errors.push('Frecuencia del sistema debe ser mayor a 0');
    }

    if (data.superficies.length === 0) {
      errors.push('Debe haber al menos una superficie/ambiente');
    }

    if (data.consumos.length === 0) {
      errors.push('Debe haber al menos un consumo/carga');
    }

    // Validar superficies
    data.superficies.forEach((superficie, index) => {
      if (superficie.area <= 0) {
        errors.push(`Superficie ${index + 1}: Área debe ser mayor a 0`);
      }
    });

    // Validar consumos
    data.consumos.forEach((consumo, index) => {
      if (consumo.power <= 0) {
        errors.push(`Consumo ${index + 1}: Potencia debe ser mayor a 0`);
      }
      if (consumo.quantity <= 0) {
        errors.push(`Consumo ${index + 1}: Cantidad debe ser mayor a 0`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Limpia archivo temporal
   */
  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Archivo temporal eliminado: ${filePath}`);
      }
    } catch (error) {
      this.logger.warn(`No se pudo eliminar archivo temporal ${filePath}: ${error.message}`);
    }
  }
}
