import { Injectable, Logger } from '@nestjs/common';
import { NormParamService } from './norm-param.service';
import { CircuitAllocatorService } from './circuit-allocator.service';
import { ConductorSizerService } from './conductor-sizer.service';
import { ProtectionSelectorService } from './protection-selector.service';
import { VoltageDropService } from './voltage-drop.service';
import { ShortCircuitService } from './short-circuit.service';
import { SelectivityService } from './selectivity.service';

export interface SistemaElectricoCompleto {
  id: string;
  tensionNominal: number; // voltios
  tipoSistema: 'MONOFASICO' | 'TRIFASICO';
  cargas: Array<{
    id: string;
    tipo: string;
    potencia: number; // VA
    ambiente: string;
    uso: string;
    ubicacion: string;
    factorDemanda: number;
  }>;
  parametrosAmbiente: {
    temperatura: number; // °C
    tipoInstalacion: string;
    materialConductor: string;
  };
}

export interface ValidacionCompleta {
  sistemaId: string;
  timestamp: Date;
  estadoGeneral: 'APROBADO' | 'CON_OBSERVACIONES' | 'RECHAZADO';
  resumen: {
    totalCargas: number;
    totalCircuitos: number;
    circuitosAprobados: number;
    circuitosConObservaciones: number;
    circuitosRechazados: number;
    scoreGeneral: number; // 0-100
  };
  validaciones: {
    asignacionCircuitos: any;
    dimensionamientoConductores: Array<{
      circuitoId: string;
      resultado?: any;
      error?: string;
    }>;
    seleccionProtecciones: Array<{
      circuitoId: string;
      resultado?: any;
      error?: string;
    }>;
    caidaTension: Array<{
      circuitoId: string;
      resultado?: any;
      error?: string;
    }>;
    cortocircuito: Array<{
      circuitoId: string;
      resultado?: any;
      error?: string;
    }>;
    selectividad: Array<{
      circuitoId: string;
      resultado?: any;
      error?: string;
    }>;
  };
  observaciones: string[];
  recomendaciones: string[];
  metadata: {
    version: string;
    duracionValidacion: number; // ms
    serviciosUtilizados: string[];
  };
}

export interface CriteriosValidacion {
  scoreMinimoAprobacion: number; // 0-100
  toleranciaObservaciones: number; // % máximo para observaciones
  maxCargasPorCircuito: number;
  maxCaidaTension: number; // %
  minFactorSeguridad: number;
  maxTiempoCoordinacion: number; // segundos
}

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(
    private readonly normParamService: NormParamService,
    private readonly circuitAllocatorService: CircuitAllocatorService,
    private readonly conductorSizerService: ConductorSizerService,
    private readonly protectionSelectorService: ProtectionSelectorService,
    private readonly voltageDropService: VoltageDropService,
    private readonly shortCircuitService: ShortCircuitService,
    private readonly selectivityService: SelectivityService,
  ) {}

  /**
   * Valida un sistema eléctrico completo
   */
  async validarSistemaCompleto(
    sistema: SistemaElectricoCompleto,
    warnings: string[] = [],
  ): Promise<ValidacionCompleta> {
    const startTime = Date.now();
    this.logger.log(`Iniciando validación completa del sistema ${sistema.id}`);

    try {
      // Obtener criterios de validación
      const criterios = await this.obtenerCriteriosValidacion(warnings);

      // 1. Validar asignación de circuitos
      const validacionCircuitos = await this.validarAsignacionCircuitos(
        sistema,
        warnings,
      );

      // 2. Validar dimensionamiento de conductores
      const validacionConductores = await this.validarDimensionamientoConductores(
        sistema,
        validacionCircuitos,
        warnings,
      );

      // 3. Validar selección de protecciones
      const validacionProtecciones = await this.validarSeleccionProtecciones(
        sistema,
        validacionConductores,
        warnings,
      );

      // 4. Validar caída de tensión
      const validacionCaidaTension = await this.validarCaidaTension(
        sistema,
        validacionConductores,
        warnings,
      );

      // 5. Validar cortocircuito
      const validacionCortocircuito = await this.validarCortocircuito(
        sistema,
        validacionProtecciones,
        warnings,
      );

      // 6. Validar selectividad
      const validacionSelectividad = await this.validarSelectividad(
        sistema,
        validacionProtecciones,
        warnings,
      );

      // Calcular estado general y score
      const { estadoGeneral, scoreGeneral, observaciones, recomendaciones } =
        this.calcularEstadoGeneral(
          validacionCircuitos,
          validacionConductores,
          validacionProtecciones,
          validacionCaidaTension,
          validacionCortocircuito,
          validacionSelectividad,
          criterios,
        );

      const duracionValidacion = Date.now() - startTime;

      this.logger.log(
        `Validación completada en ${duracionValidacion}ms. Estado: ${estadoGeneral}`,
      );

      return {
        sistemaId: sistema.id,
        timestamp: new Date(),
        estadoGeneral,
        resumen: {
          totalCargas: sistema.cargas.length,
          totalCircuitos: (validacionCircuitos as any).circuitos?.length || 0,
          circuitosAprobados: this.contarCircuitosAprobados([
            validacionConductores,
            validacionProtecciones,
            validacionCaidaTension,
            validacionCortocircuito,
            validacionSelectividad,
          ]),
          circuitosConObservaciones: this.contarCircuitosConObservaciones([
            validacionConductores,
            validacionProtecciones,
            validacionCaidaTension,
            validacionCortocircuito,
            validacionSelectividad,
          ]),
          circuitosRechazados: this.contarCircuitosRechazados([
            validacionConductores,
            validacionProtecciones,
            validacionCaidaTension,
            validacionCortocircuito,
            validacionSelectividad,
          ]),
          scoreGeneral,
        },
        validaciones: {
          asignacionCircuitos: validacionCircuitos,
          dimensionamientoConductores: validacionConductores,
          seleccionProtecciones: validacionProtecciones,
          caidaTension: validacionCaidaTension,
          cortocircuito: validacionCortocircuito,
          selectividad: validacionSelectividad,
        },
        observaciones,
        recomendaciones,
        metadata: {
          version: '1.0.0',
          duracionValidacion,
          serviciosUtilizados: [
            'CircuitAllocatorService',
            'ConductorSizerService',
            'ProtectionSelectorService',
            'VoltageDropService',
            'ShortCircuitService',
            'SelectivityService',
          ],
        },
      };
    } catch (error) {
      this.logger.error('Error en validación completa del sistema', error);
      throw new Error(`Error en validación del sistema: ${error.message}`);
    }
  }

  /**
   * Valida la asignación de circuitos
   */
  private async validarAsignacionCircuitos(
    sistema: SistemaElectricoCompleto,
    warnings: string[],
  ) {
          try {
        const cargas = sistema.cargas.map((carga) => ({
          id: carga.id,
          environment: carga.ambiente,
          type: carga.tipo as 'ILU' | 'TOM' | 'IUG' | 'TUG' | 'IUE' | 'TUE',
          watts: carga.potencia,
          vaCalculado: carga.potencia,
          factorDemanda: carga.factorDemanda,
        }));

        return await this.circuitAllocatorService.asignarCargasACircuitos(
          cargas,
          warnings,
        );
      } catch (error) {
      this.logger.warn('Error en validación de asignación de circuitos', error);
      return { error: error.message };
    }
  }

  /**
   * Valida el dimensionamiento de conductores
   */
  private async validarDimensionamientoConductores(
    sistema: SistemaElectricoCompleto,
    validacionCircuitos: any,
    warnings: string[],
  ): Promise<Array<{
    circuitoId: string;
    resultado?: any;
    error?: string;
  }>> {
    if (validacionCircuitos.error || !(validacionCircuitos as any).circuitos) {
      return [];
    }

    const resultados: Array<{
      circuitoId: string;
      resultado?: any;
      error?: string;
    }> = [];

    for (const circuito of (validacionCircuitos as any).circuitos) {
      try {
        const corrienteDiseño = circuito.corrienteTotal;
        const material = sistema.parametrosAmbiente.materialConductor;
        const temperatura = sistema.parametrosAmbiente.temperatura;

        const resultado = await this.conductorSizerService.seleccionarConductor(
          corrienteDiseño,
          temperatura,
          1, // agrupamiento por defecto
          sistema.parametrosAmbiente.tipoInstalacion,
          'THHN', // tipo de aislamiento por defecto
          material as 'COBRE' | 'ALUMINIO',
          warnings,
        );

        resultados.push({
          circuitoId: circuito.id,
          resultado,
        });
      } catch (error) {
        this.logger.warn(
          `Error en validación de conductor para circuito ${circuito.id}`,
          error,
        );
        resultados.push({
          circuitoId: circuito.id,
          error: error.message,
        });
      }
    }

    return resultados;
  }

  /**
   * Valida la selección de protecciones
   */
  private async validarSeleccionProtecciones(
    sistema: SistemaElectricoCompleto,
    validacionConductores: Array<{
      circuitoId: string;
      resultado?: any;
      error?: string;
    }>,
    warnings: string[],
  ): Promise<Array<{
    circuitoId: string;
    resultado?: any;
    error?: string;
  }>> {
    const resultados: Array<{
      circuitoId: string;
      resultado?: any;
      error?: string;
    }> = [];

    for (const validacion of validacionConductores) {
      if (validacion.error) {
        resultados.push(validacion);
        continue;
      }

      try {
        const criterios = {
          corrienteDiseño: validacion.resultado.corrienteDiseño,
          tipoCircuito: 'TOM' as const, // Por defecto, se puede mejorar
          ambiente: 'GENERAL',
          uso: 'GENERAL',
          tension: sistema.tensionNominal,
          corrienteCortocircuito: 5000, // Valor por defecto
        };

        const resultado = await this.protectionSelectorService.seleccionarProteccion(
          criterios,
          warnings,
        );

        resultados.push({
          circuitoId: validacion.circuitoId,
          resultado,
        });
      } catch (error) {
        this.logger.warn(
          `Error en validación de protección para circuito ${validacion.circuitoId}`,
          error,
        );
        resultados.push({
          circuitoId: validacion.circuitoId,
          error: error.message,
        });
      }
    }

    return resultados;
  }

  /**
   * Valida la caída de tensión
   */
  private async validarCaidaTension(
    sistema: SistemaElectricoCompleto,
    validacionConductores: Array<{
      circuitoId: string;
      resultado?: any;
      error?: string;
    }>,
    warnings: string[],
  ): Promise<Array<{
    circuitoId: string;
    resultado?: any;
    error?: string;
  }>> {
    const resultados: Array<{
      circuitoId: string;
      resultado?: any;
      error?: string;
    }> = [];

    for (const validacion of validacionConductores) {
      if (validacion.error) {
        resultados.push(validacion);
        continue;
      }

      try {
        const circuito = {
          id: validacion.circuitoId,
          tipo: 'TOM',
          longitud: 50, // Valor por defecto, se puede mejorar
          corriente: validacion.resultado.corrienteDiseño,
          tension: sistema.tensionNominal,
          material: sistema.parametrosAmbiente.materialConductor,
          seccion: validacion.resultado.seccion,
          tipoInstalacion: sistema.parametrosAmbiente.tipoInstalacion,
          temperatura: sistema.parametrosAmbiente.temperatura,
        };

        const resultado = await this.voltageDropService.calcularCaidaTension(
          circuito,
          warnings,
        );

        resultados.push({
          circuitoId: validacion.circuitoId,
          resultado,
        });
      } catch (error) {
        this.logger.warn(
          `Error en validación de caída de tensión para circuito ${validacion.circuitoId}`,
          error,
        );
        resultados.push({
          circuitoId: validacion.circuitoId,
          error: error.message,
        });
      }
    }

    return resultados;
  }

  /**
   * Valida el cortocircuito
   */
  private async validarCortocircuito(
    sistema: SistemaElectricoCompleto,
    validacionProtecciones: Array<{
      circuitoId: string;
      resultado?: any;
      error?: string;
    }>,
    warnings: string[],
  ): Promise<Array<{
    circuitoId: string;
    resultado?: any;
    error?: string;
  }>> {
    const resultados: Array<{
      circuitoId: string;
      resultado?: any;
      error?: string;
    }> = [];

    for (const validacion of validacionProtecciones) {
      if (validacion.error) {
        resultados.push(validacion);
        continue;
      }

      try {
        const sistemaElectrico = {
          tensionNominal: sistema.tensionNominal,
          potenciaAparente: 100000, // Valor por defecto
          factorPotencia: 0.85,
          tipoSistema: sistema.tipoSistema,
          impedanciaFuente: 0.1, // Valor por defecto
          factorK: 6,
        };

        const circuito = {
          id: validacion.circuitoId,
          tipo: 'TOM',
          corrienteNominal: validacion.resultado.corrienteDiseño,
          longitud: 50,
          material: 'COBRE',
          seccion: 10, // Valor por defecto
          tipoInstalacion: 'TUBO',
          temperatura: 25,
          proteccion: {
            tipo: validacion.resultado.tipo,
            amperaje: validacion.resultado.amperaje,
            curva: validacion.resultado.curva,
            corrienteInterruptora: validacion.resultado.corrienteInterruptora,
          },
        };

        const resultado = await this.shortCircuitService.analizarCortocircuito(
          sistemaElectrico,
          circuito,
          warnings,
        );

        resultados.push({
          circuitoId: validacion.circuitoId,
          resultado,
        });
      } catch (error) {
        this.logger.warn(
          `Error en validación de cortocircuito para circuito ${validacion.circuitoId}`,
          error,
        );
        resultados.push({
          circuitoId: validacion.circuitoId,
          error: error.message,
        });
      }
    }

    return resultados;
  }

  /**
   * Valida la selectividad
   */
  private async validarSelectividad(
    sistema: SistemaElectricoCompleto,
    validacionProtecciones: Array<{
      circuitoId: string;
      resultado?: any;
      error?: string;
    }>,
    warnings: string[],
  ): Promise<Array<{
    circuitoId: string;
    resultado?: any;
    error?: string;
  }>> {
    const resultados: Array<{
      circuitoId: string;
      resultado?: any;
      error?: string;
    }> = [];

    for (const validacion of validacionProtecciones) {
      if (validacion.error) {
        resultados.push(validacion);
        continue;
      }

      try {
        const circuito = {
          id: validacion.circuitoId,
          protecciones: [
            {
              id: 'PROTECCION_1',
              tipo: validacion.resultado.tipo,
              amperaje: validacion.resultado.amperaje,
              curva: validacion.resultado.curva,
              polo: '1P',
              corrienteInterruptora: validacion.resultado.corrienteInterruptora,
              tiempoInterrupcion: 0.1, // Valor por defecto
              ubicacion: 'CIRCUITO',
              nivel: 1,
            },
            {
              id: 'PROTECCION_2',
              tipo: 'MCB',
              amperaje: 63,
              curva: 'C',
              polo: '1P',
              corrienteInterruptora: 630,
              tiempoInterrupcion: 0.2,
              ubicacion: 'SUB_PANEL',
              nivel: 2,
            },
          ],
          corrienteMaxima: validacion.resultado.corrienteDiseño,
          tipo: 'TOM',
          ambiente: 'GENERAL',
          uso: 'GENERAL',
        };

        const resultado = await this.selectivityService.analizarSelectividad(
          circuito,
          warnings,
        );

        resultados.push({
          circuitoId: validacion.circuitoId,
          resultado,
        });
      } catch (error) {
        this.logger.warn(
          `Error en validación de selectividad para circuito ${validacion.circuitoId}`,
          error,
        );
        resultados.push({
          circuitoId: validacion.circuitoId,
          error: error.message,
        });
      }
    }

    return resultados;
  }

  /**
   * Obtiene los criterios de validación
   */
  private async obtenerCriteriosValidacion(
    warnings: string[],
  ): Promise<CriteriosValidacion> {
    try {
      const criterios = await this.normParamService.getParam('CRITERIOS_VALIDACION');
      const criteriosParsed = JSON.parse(criterios);

      if (!criteriosParsed) {
        this.logger.warn(
          'Criterios de validación no encontrados, usando valores por defecto',
          { warnings },
        );
        return this.obtenerCriteriosPorDefecto();
      }

      return criteriosParsed;
    } catch (error) {
      this.logger.warn(
        'Usando criterios por defecto debido a error',
        { warnings },
      );
      return this.obtenerCriteriosPorDefecto();
    }
  }

  /**
   * Criterios por defecto
   */
  private obtenerCriteriosPorDefecto(): CriteriosValidacion {
    return {
      scoreMinimoAprobacion: 80,
      toleranciaObservaciones: 20,
      maxCargasPorCircuito: 10,
      maxCaidaTension: 5,
      minFactorSeguridad: 1.5,
      maxTiempoCoordinacion: 0.5,
    };
  }

  /**
   * Calcula el estado general del sistema
   */
  private calcularEstadoGeneral(
    validacionCircuitos: any,
    validacionConductores: any[],
    validacionProtecciones: any[],
    validacionCaidaTension: any[],
    validacionCortocircuito: any[],
    validacionSelectividad: any[],
    criterios: CriteriosValidacion,
  ) {
    let scoreTotal = 0;
    let totalValidaciones = 0;
    const observaciones: string[] = [];
    const recomendaciones: string[] = [];

    // Validar asignación de circuitos
    if (validacionCircuitos.error) {
      observaciones.push(`Error en asignación de circuitos: ${validacionCircuitos.error}`);
      scoreTotal += 0;
    } else if (validacionCircuitos.circuitos) {
      scoreTotal += 20; // 20 puntos por asignación correcta
      totalValidaciones++;
    }

    // Validar conductores
    const scoreConductores = this.calcularScoreConductores(validacionConductores);
    scoreTotal += scoreConductores;
    totalValidaciones += validacionConductores.length;

    // Validar protecciones
    const scoreProtecciones = this.calcularScoreProtecciones(validacionProtecciones);
    scoreTotal += scoreProtecciones;
    totalValidaciones += validacionProtecciones.length;

    // Validar caída de tensión
    const scoreCaidaTension = this.calcularScoreCaidaTension(validacionCaidaTension);
    scoreTotal += scoreCaidaTension;
    totalValidaciones += validacionCaidaTension.length;

    // Validar cortocircuito
    const scoreCortocircuito = this.calcularScoreCortocircuito(validacionCortocircuito);
    scoreTotal += scoreCortocircuito;
    totalValidaciones += validacionCortocircuito.length;

    // Validar selectividad
    const scoreSelectividad = this.calcularScoreSelectividad(validacionSelectividad);
    scoreTotal += scoreSelectividad;
    totalValidaciones += validacionSelectividad.length;

    // Calcular score promedio
    const scoreGeneral = totalValidaciones > 0 ? scoreTotal / totalValidaciones : 0;

    // Determinar estado general
    let estadoGeneral: 'APROBADO' | 'CON_OBSERVACIONES' | 'RECHAZADO';
    if (scoreGeneral >= criterios.scoreMinimoAprobacion) {
      estadoGeneral = 'APROBADO';
    } else if (scoreGeneral >= criterios.scoreMinimoAprobacion * 0.7) {
      estadoGeneral = 'CON_OBSERVACIONES';
    } else {
      estadoGeneral = 'RECHAZADO';
    }

    // Generar recomendaciones generales
    if (scoreGeneral < criterios.scoreMinimoAprobacion) {
      recomendaciones.push('Revisar y corregir las validaciones que no cumplen los criterios');
    }
    if (observaciones.length > 0) {
      recomendaciones.push('Atender las observaciones identificadas antes de la implementación');
    }

    return {
      estadoGeneral,
      scoreGeneral: Math.round(scoreGeneral * 100) / 100,
      observaciones,
      recomendaciones,
    };
  }

  /**
   * Calcula el score de conductores
   */
  private calcularScoreConductores(validaciones: any[]): number {
    let score = 0;
    for (const validacion of validaciones) {
      if (validacion.error) {
        score += 0;
      } else if (validacion.resultado.cumpleNorma) {
        score += 20;
      } else {
        score += 10;
      }
    }
    return score;
  }

  /**
   * Calcula el score de protecciones
   */
  private calcularScoreProtecciones(validaciones: any[]): number {
    let score = 0;
    for (const validacion of validaciones) {
      if (validacion.error) {
        score += 0;
      } else if (validacion.resultado.cumpleNorma) {
        score += 20;
      } else {
        score += 10;
      }
    }
    return score;
  }

  /**
   * Calcula el score de caída de tensión
   */
  private calcularScoreCaidaTension(validaciones: any[]): number {
    let score = 0;
    for (const validacion of validaciones) {
      if (validacion.error) {
        score += 0;
      } else if (validacion.resultado.cumpleNorma) {
        score += 20;
      } else {
        score += 10;
      }
    }
    return score;
  }

  /**
   * Calcula el score de cortocircuito
   */
  private calcularScoreCortocircuito(validaciones: any[]): number {
    let score = 0;
    for (const validacion of validaciones) {
      if (validacion.error) {
        score += 0;
      } else if (validacion.resultado.cumpleNorma) {
        score += 20;
      } else {
        score += 10;
      }
    }
    return score;
  }

  /**
   * Calcula el score de selectividad
   */
  private calcularScoreSelectividad(validaciones: any[]): number {
    let score = 0;
    for (const validacion of validaciones) {
      if (validacion.error) {
        score += 0;
      } else if (validacion.resultado.selectividadCumple && validacion.resultado.coordinacionCumple) {
        score += 20;
      } else if (validacion.resultado.selectividadCumple || validacion.resultado.coordinacionCumple) {
        score += 10;
      } else {
        score += 5;
      }
    }
    return score;
  }

  /**
   * Cuenta circuitos aprobados
   */
  private contarCircuitosAprobados(validaciones: any[][]): number {
    let count = 0;
    for (const validacion of validaciones) {
      for (const item of validacion) {
        if (item.resultado?.cumpleNorma ||
            (item.resultado?.selectividadCumple && item.resultado?.coordinacionCumple)) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Cuenta circuitos con observaciones
   */
  private contarCircuitosConObservaciones(validaciones: any[][]): number {
    let count = 0;
    for (const validacion of validaciones) {
      for (const item of validacion) {
        if (item.resultado && !item.error &&
            !item.resultado.cumpleNorma &&
            !(item.resultado.selectividadCumple && item.resultado.coordinacionCumple)) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Cuenta circuitos rechazados
   */
  private contarCircuitosRechazados(validaciones: any[][]): number {
    let count = 0;
    for (const validacion of validaciones) {
      for (const item of validacion) {
        if (item.error) {
          count++;
        }
      }
    }
    return count;
  }
}
