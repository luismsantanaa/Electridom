import { Injectable } from '@nestjs/common';
import { RuleProviderService } from '../../rules/rule-provider.service';
import { PreviewRequestDto } from '../dtos/preview.request.dto';
import { PreviewResponseDto } from '../dtos/preview.response.dto';

interface AmbienteData {
  nombre: string;
  areaM2: number;
  consumos: Array<{ nombre: string; watts: number; factorUso?: number }>;
}

interface CargaCalculada {
  ambiente: string;
  iluminacionVA: number;
  tomasVA: number;
  cargasFijasVA: number;
  totalVA: number;
}

interface CircuitoPropuesto {
  tipo: 'ILU' | 'TOM';
  cargaAsignadaVA: number;
  ambientesIncluidos: string[];
  breakerSugerido: string;
  calibreSugerido: string;
}

@Injectable()
export class CalculationDomainService {
  constructor(private readonly ruleProvider: RuleProviderService) {}

  async calcularPreview(
    request: PreviewRequestDto,
    warnings: string[],
  ): Promise<PreviewResponseDto> {
    const ruleSetOptions = {
      ruleSetId: request.opciones?.ruleSetId,
      effectiveDate: request.opciones?.effectiveDate,
    };

    // Normalizar y validar datos de entrada
    const ambientesNormalizados = this.normalizarAmbientes(request.superficies);
    this.validarConsumos(request.consumos, ambientesNormalizados);

    // Agrupar datos por ambiente
    const datosPorAmbiente = this.agruparDatosPorAmbiente(
      ambientesNormalizados,
      request.consumos,
    );

    // Calcular cargas por ambiente
    const cargasPorAmbiente = await this.calcularCargasPorAmbiente(
      datosPorAmbiente,
      warnings,
      ruleSetOptions,
    );

    // Calcular totales
    const totales = await this.calcularTotales(
      cargasPorAmbiente,
      warnings,
      ruleSetOptions,
    );

    // Generar propuesta de circuitos
    const propuestaCircuitos = await this.generarPropuestaCircuitos(
      cargasPorAmbiente,
      warnings,
      ruleSetOptions,
    );

    return {
      cargasPorAmbiente,
      totales,
      propuestaCircuitos,
      warnings,
      traceId: '', // Se llenará en el interceptor
    };
  }

  // Métodos de validación y normalización
  private normalizarAmbientes(superficies: any[]): Map<string, number> {
    const ambientes = new Map<string, number>();

    for (const superficie of superficies) {
      const nombreNormalizado = superficie.ambiente.trim().toLowerCase();

      if (ambientes.has(nombreNormalizado)) {
        throw new Error(`El ambiente '${superficie.ambiente}' está duplicado`);
      }

      ambientes.set(nombreNormalizado, superficie.areaM2);
    }

    return ambientes;
  }

  private validarConsumos(
    consumos: any[],
    ambientes: Map<string, number>,
  ): void {
    for (const consumo of consumos) {
      const ambienteNormalizado = consumo.ambiente.trim().toLowerCase();
      if (!ambientes.has(ambienteNormalizado)) {
        throw new Error(
          `El consumo '${consumo.nombre}' referencia un ambiente inexistente: '${consumo.ambiente}'`,
        );
      }
    }
  }

  private agruparDatosPorAmbiente(
    ambientes: Map<string, number>,
    consumos: any[],
  ): AmbienteData[] {
    const datosPorAmbiente: AmbienteData[] = [];

    for (const [nombreAmbiente, area] of ambientes) {
      const consumosDelAmbiente = consumos.filter(
        (consumo) => consumo.ambiente.trim().toLowerCase() === nombreAmbiente,
      );

      datosPorAmbiente.push({
        nombre: nombreAmbiente,
        areaM2: area,
        consumos: consumosDelAmbiente.map((c) => ({
          nombre: c.nombre,
          watts: c.watts,
          factorUso: c.factorUso || 1,
        })),
      });
    }

    return datosPorAmbiente;
  }

  // Métodos de cálculo de cargas
  private async calcularCargasPorAmbiente(
    datosPorAmbiente: AmbienteData[],
    warnings: string[],
    ruleSetOptions: any,
  ): Promise<CargaCalculada[]> {
    const cargasPorAmbiente: CargaCalculada[] = [];

    for (const datos of datosPorAmbiente) {
      const iluminacionVA = await this.calcularIluminacion(
        datos.areaM2,
        warnings,
        ruleSetOptions,
      );

      const tomasVA = this.calcularTomas(datos.consumos);

      const cargasFijasVA = 0; // Por ahora no implementado

      cargasPorAmbiente.push({
        ambiente: datos.nombre,
        iluminacionVA,
        tomasVA,
        cargasFijasVA,
        totalVA: iluminacionVA + tomasVA + cargasFijasVA,
      });
    }

    return cargasPorAmbiente;
  }

  private async calcularIluminacion(
    areaM2: number,
    warnings: string[],
    ruleSetOptions: any,
  ): Promise<number> {
    const luzVAPorM2 = await this.ruleProvider.getNumber('LUZ_VA_POR_M2', {
      fallback: 100,
      warnings,
      ...ruleSetOptions,
    });

    return areaM2 * luzVAPorM2;
  }

  private calcularTomas(consumos: Array<{ watts: number }>): number {
    return consumos.reduce((total, consumo) => total + consumo.watts, 0);
  }

  // Métodos de cálculo de totales
  private async calcularTotales(
    cargasPorAmbiente: CargaCalculada[],
    warnings: string[],
    ruleSetOptions: any,
  ): Promise<{ totalConectadaVA: number; demandaEstimadaVA: number }> {
    const totalConectadaVA = cargasPorAmbiente.reduce(
      (total, carga) => total + carga.totalVA,
      0,
    );

    const demandaEstimadaVA = await this.calcularDemandaEstimada(
      cargasPorAmbiente,
      warnings,
      ruleSetOptions,
    );

    return {
      totalConectadaVA,
      demandaEstimadaVA,
    };
  }

  private async calcularDemandaEstimada(
    cargasPorAmbiente: CargaCalculada[],
    warnings: string[],
    ruleSetOptions: any,
  ): Promise<number> {
    const factorDemandaLuz = await this.ruleProvider.getNumber(
      'FACTOR_DEMANDA_LUZ',
      { fallback: 1, warnings, ...ruleSetOptions },
    );

    const factorDemandaToma = await this.ruleProvider.getNumber(
      'FACTOR_DEMANDA_TOMA',
      { fallback: 1, warnings, ...ruleSetOptions },
    );

    let demandaEstimada = 0;

    for (const carga of cargasPorAmbiente) {
      demandaEstimada +=
        carga.iluminacionVA * factorDemandaLuz +
        carga.tomasVA * factorDemandaToma;
    }

    return demandaEstimada;
  }

  // Métodos de generación de circuitos
  private async generarPropuestaCircuitos(
    cargasPorAmbiente: CargaCalculada[],
    warnings: string[],
    ruleSetOptions: any,
  ): Promise<CircuitoPropuesto[]> {
    const iluVAMaxPorCircuito = await this.ruleProvider.getNumber(
      'ILU_VA_MAX_POR_CIRCUITO',
      { fallback: 1440, warnings, ...ruleSetOptions },
    );

    const tomaVAMaxPorCircuito = await this.ruleProvider.getNumber(
      'TOMA_VA_MAX_POR_CIRCUITO',
      { fallback: 1800, warnings, ...ruleSetOptions },
    );

    const circuitos: CircuitoPropuesto[] = [];

    // Circuito de iluminación
    const totalIluminacion = cargasPorAmbiente.reduce(
      (total, carga) => total + carga.iluminacionVA,
      0,
    );

    if (totalIluminacion > 0) {
      circuitos.push({
        tipo: 'ILU',
        cargaAsignadaVA: totalIluminacion,
        ambientesIncluidos: cargasPorAmbiente.map((c) => c.ambiente),
        breakerSugerido: '15A // TODO validar RIE RD',
        calibreSugerido: 'AWG 14 // TODO validar RIE RD',
      });
    }

    // Circuito de tomacorrientes
    const totalTomas = cargasPorAmbiente.reduce(
      (total, carga) => total + carga.tomasVA,
      0,
    );

    if (totalTomas > 0) {
      circuitos.push({
        tipo: 'TOM',
        cargaAsignadaVA: totalTomas,
        ambientesIncluidos: cargasPorAmbiente.map((c) => c.ambiente),
        breakerSugerido: '20A // TODO validar RIE RD',
        calibreSugerido: 'AWG 12 // TODO validar RIE RD',
      });
    }

    return circuitos;
  }
}
