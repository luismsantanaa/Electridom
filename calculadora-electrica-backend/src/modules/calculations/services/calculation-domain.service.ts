import { Injectable } from '@nestjs/common';
import { RuleProviderService } from '../../rules/rule-provider.service';
import { PreviewRequestDto } from '../dtos/preview.request.dto';
import { PreviewResponseDto } from '../dtos/preview.response.dto';

interface AmbienteData {
  name: string;
  areaM2: number;
  consumptions: Array<{ name: string; watts: number; factorUso?: number }>;
}

interface CargaCalculada {
  environment: string;
  iluminacionVA: number;
  tomasVA: number;
  cargasFijasVA: number;
  totalVA: number;
}

interface CircuitoPropuesto {
  type: 'ILU' | 'TOM';
  cargaAsignadaVA: number;
  ambientesIncluidos: string[];
  breakerSugerido: string;
  calibreSugerido: string;
}

interface RuleSetOptions {
  ruleSetId?: string;
  effectiveDate?: string;
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
    const ambientesNormalizados = this.normalizarAmbientes(request.surfaces);
    this.validarConsumos(request.consumptions, ambientesNormalizados);

    // Agrupar datos por environment
    const datosPorAmbiente = this.agruparDatosPorAmbiente(
      ambientesNormalizados,
      request.consumptions,
    );

    // Calcular loads por environment
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

    // Generar propuesta de circuits
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
  private normalizarAmbientes(surfaces: Array<{ environment: string; areaM2: number }>): Map<string, number> {
    const environments = new Map<string, number>();

    for (const surface of surfaces) {
      const nombreNormalizado = surface.environment.trim().toLowerCase();

      if (environments.has(nombreNormalizado)) {
        throw new Error(
          `El environment '${surface.environment}' está duplicado`,
        );
      }

      environments.set(nombreNormalizado, surface.areaM2);
    }

    return environments;
  }

  private validarConsumos(
    consumptions: any[],
    environments: Map<string, number>,
  ): void {
    for (const consumption of consumptions) {
      const ambienteNormalizado = consumption.environment.trim().toLowerCase();
      if (!environments.has(ambienteNormalizado)) {
        throw new Error(
          `El consumption '${consumption.name}' referencia un environment inexistente: '${consumption.environment}'`,
        );
      }
    }
  }

  private agruparDatosPorAmbiente(
    environments: Map<string, number>,
    consumptions: any[],
  ): AmbienteData[] {
    const datosPorAmbiente: AmbienteData[] = [];

    for (const [nombreAmbiente, area] of environments) {
      const consumosDelAmbiente = consumptions.filter(
        (consumption) =>
          consumption.environment.trim().toLowerCase() === nombreAmbiente,
      );

      datosPorAmbiente.push({
        name: nombreAmbiente,
        areaM2: area,
        consumptions: consumosDelAmbiente.map((c) => ({
          name: c.name,
          watts: c.watts,
          factorUso: c.factorUso || 1,
        })),
      });
    }

    return datosPorAmbiente;
  }

  // Métodos de cálculo de loads
  private async calcularCargasPorAmbiente(
    datosPorAmbiente: AmbienteData[],
    warnings: string[],
    ruleSetOptions: RuleSetOptions,
  ): Promise<CargaCalculada[]> {
    const cargasPorAmbiente: CargaCalculada[] = [];

    for (const datos of datosPorAmbiente) {
      const iluminacionVA = await this.calcularIluminacion(
        datos.areaM2,
        warnings,
        ruleSetOptions,
      );

      const tomasVA = this.calcularTomas(datos.consumptions);

      const cargasFijasVA = 0; // Por ahora no implementado

      cargasPorAmbiente.push({
        environment: datos.name,
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
    ruleSetOptions: RuleSetOptions,
  ): Promise<number> {
    const luzVAPorM2 = await this.ruleProvider.getNumber('LUZ_VA_POR_M2', {
      fallback: 100,
      warnings,
      ...ruleSetOptions,
    });

    return areaM2 * luzVAPorM2;
  }

  private calcularTomas(consumptions: Array<{ watts: number }>): number {
    return consumptions.reduce(
      (total, consumption) => total + consumption.watts,
      0,
    );
  }

  // Métodos de cálculo de totales
  private async calcularTotales(
    cargasPorAmbiente: CargaCalculada[],
    warnings: string[],
    ruleSetOptions: RuleSetOptions,
  ): Promise<{ totalConectadaVA: number; demandaEstimadaVA: number }> {
    const totalConectadaVA = cargasPorAmbiente.reduce(
      (total, load) => total + load.totalVA,
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
    ruleSetOptions: RuleSetOptions,
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

    for (const load of cargasPorAmbiente) {
      demandaEstimada +=
        load.iluminacionVA * factorDemandaLuz +
        load.tomasVA * factorDemandaToma;
    }

    return demandaEstimada;
  }

  // Métodos de generación de circuits
  private async generarPropuestaCircuitos(
    cargasPorAmbiente: CargaCalculada[],
    warnings: string[],
    ruleSetOptions: RuleSetOptions,
  ): Promise<CircuitoPropuesto[]> {
    const iluVAMaxPorCircuito = await this.ruleProvider.getNumber(
      'ILU_VA_MAX_POR_CIRCUITO',
      { fallback: 1440, warnings, ...ruleSetOptions },
    );

    const tomaVAMaxPorCircuito = await this.ruleProvider.getNumber(
      'TOMA_VA_MAX_POR_CIRCUITO',
      { fallback: 1800, warnings, ...ruleSetOptions },
    );

    const circuits: CircuitoPropuesto[] = [];

    // circuit de iluminación
    const totalIluminacion = cargasPorAmbiente.reduce(
      (total, load) => total + load.iluminacionVA,
      0,
    );

    if (totalIluminacion > 0) {
      circuits.push({
        type: 'ILU',
        cargaAsignadaVA: totalIluminacion,
        ambientesIncluidos: cargasPorAmbiente.map((c) => c.environment),
        breakerSugerido: '15A // TODO validar RIE RD',
        calibreSugerido: 'AWG 14 // TODO validar RIE RD',
      });
    }

    // circuit de tomacorrientes
    const totalTomas = cargasPorAmbiente.reduce(
      (total, load) => total + load.tomasVA,
      0,
    );

    if (totalTomas > 0) {
      circuits.push({
        type: 'TOM',
        cargaAsignadaVA: totalTomas,
        ambientesIncluidos: cargasPorAmbiente.map((c) => c.environment),
        breakerSugerido: '20A // TODO validar RIE RD',
        calibreSugerido: 'AWG 12 // TODO validar RIE RD',
      });
    }

    return circuits;
  }
}
