import { Injectable, Logger } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { AIExplanationService } from './ai-explanation.service';
import { RuleEngineService } from './rule-engine.service';

export interface ValidacionInteligente {
  sistemaId: string;
  timestamp: Date;
  estadoGeneral: 'APROBADO' | 'CON_OBSERVACIONES' | 'RECHAZADO' | 'REQUIERE_REVISION';
  resumen: {
    totalCircuitos: number;
    circuitosAprobados: number;
    circuitosConObservaciones: number;
    circuitosRechazados: number;
    scoreValidacion: number; // 0-100
    scoreIA: number; // 0-100
    scoreReglas: number; // 0-100
    scoreGeneral: number; // 0-100
  };
  validaciones: {
    validacionBasica: any; // Resultado de ValidationService
    explicacionesIA: any[]; // Resultado de AIExplanationService
    validacionReglas: any[]; // Resultado de RuleEngineService
  };
  insights: {
    patronesIdentificados: string[];
    oportunidadesMejora: string[];
    riesgosPotenciales: string[];
    tendenciasNormativas: string[];
    recomendacionesIA: string[];
    optimizacionesSugeridas: string[];
  };
  metricas: {
    duracionTotal: number; // ms
    duracionValidacion: number; // ms
    duracionIA: number; // ms
    duracionReglas: number; // ms
    tokensUtilizados: number;
    reglasEvaluadas: number;
    serviciosUtilizados: string[];
  };
  recomendaciones: {
    criticas: string[];
    altas: string[];
    medias: string[];
    bajas: string[];
    priorizadas: string[];
  };
}

export interface CriteriosValidacionInteligente {
  scoreMinimoAprobacion: number; // 0-100
  pesoValidacionBasica: number; // 0-1
  pesoIA: number; // 0-1
  pesoReglas: number; // 0-1
  toleranciaObservaciones: number; // % máximo para observaciones
  maxReglasCriticas: number; // Máximo de reglas críticas que pueden fallar
}

@Injectable()
export class IntelligentValidationService {
  private readonly logger = new Logger(IntelligentValidationService.name);

  constructor(
    private readonly validationService: ValidationService,
    private readonly aiExplanationService: AIExplanationService,
    private readonly ruleEngineService: RuleEngineService,
  ) {}

  /**
   * Realiza validación inteligente completa de un sistema eléctrico
   */
  async validarSistemaInteligente(
    sistema: any,
    warnings: string[] = [],
  ): Promise<ValidacionInteligente> {
    const startTime = Date.now();
    this.logger.log(`Iniciando validación inteligente del sistema ${sistema.id}`);

    try {
      // 1. Validación básica (Sprint 16)
      const startValidacion = Date.now();
      const validacionBasica = await this.validationService.validarSistemaCompleto(
        sistema,
        warnings,
      );
      const duracionValidacion = Date.now() - startValidacion;

      // 2. Análisis con IA
      const startIA = Date.now();
      const explicacionesIA = await this.aiExplanationService.analizarSistemaCompleto(
        sistema,
        validacionBasica,
        warnings,
      );
      const duracionIA = Date.now() - startIA;

      // 3. Validación con motor de reglas
      const startReglas = Date.now();
      const validacionReglas = await this.validarConReglas(
        validacionBasica.validaciones.dimensionamientoConductores || [],
        warnings,
      );
      const duracionReglas = Date.now() - startReglas;

      // 4. Calcular scores y estado general
      const scores = this.calcularScores(
        validacionBasica,
        explicacionesIA,
        validacionReglas,
      );

      // 5. Generar insights consolidados
      const insights = this.consolidarInsights(
        validacionBasica,
        explicacionesIA,
        validacionReglas,
      );

      // 6. Generar recomendaciones priorizadas
      const recomendaciones = this.generarRecomendacionesPriorizadas(
        validacionBasica,
        explicacionesIA,
        validacionReglas,
      );

      const duracionTotal = Date.now() - startTime;

      this.logger.log(
        `Validación inteligente completada en ${duracionTotal}ms. Score: ${scores.scoreGeneral}`,
      );

      return {
        sistemaId: sistema.id,
        timestamp: new Date(),
        estadoGeneral: this.determinarEstadoGeneral(scores),
        resumen: {
          totalCircuitos: validacionBasica.resumen.totalCircuitos,
          circuitosAprobados: validacionBasica.resumen.circuitosAprobados,
          circuitosConObservaciones: validacionBasica.resumen.circuitosConObservaciones,
          circuitosRechazados: validacionBasica.resumen.circuitosRechazados,
          scoreValidacion: scores.scoreValidacion,
          scoreIA: scores.scoreIA,
          scoreReglas: scores.scoreReglas,
          scoreGeneral: scores.scoreGeneral,
        },
        validaciones: {
          validacionBasica,
          explicacionesIA: explicacionesIA.explicaciones,
          validacionReglas,
        },
        insights,
        metricas: {
          duracionTotal,
          duracionValidacion,
          duracionIA,
          duracionReglas,
          tokensUtilizados: explicacionesIA.metadata.tokensUtilizados,
          reglasEvaluadas: this.contarReglasEvaluadas(validacionReglas),
          serviciosUtilizados: [
            'ValidationService',
            'AIExplanationService',
            'RuleEngineService',
          ],
        },
        recomendaciones,
      };
    } catch (error) {
      this.logger.error('Error en validación inteligente del sistema', error);
      throw new Error(`Error en validación inteligente: ${error.message}`);
    }
  }

  /**
   * Valida circuitos con el motor de reglas
   */
  private async validarConReglas(
    circuitos: any[],
    warnings: string[],
  ): Promise<any[]> {
    if (circuitos.length === 0) return [];

    const resultados: any[] = [];
    for (const circuito of circuitos) {
      try {
        const resultado = await this.ruleEngineService.validarCircuito(
          circuito,
          warnings,
        );
        resultados.push(resultado);
      } catch (error) {
        this.logger.warn(
          `Error validando reglas para circuito ${circuito.circuitoId}`,
          error,
        );
        warnings.push(`Circuito ${circuito.circuitoId}: ${error.message}`);
      }
    }

    return resultados;
  }

  /**
   * Calcula los scores de cada componente
   */
  private calcularScores(
    validacionBasica: any,
    explicacionesIA: any,
    validacionReglas: any[],
  ): {
    scoreValidacion: number;
    scoreIA: number;
    scoreReglas: number;
    scoreGeneral: number;
  } {
    // Score de validación básica
    const scoreValidacion = validacionBasica.resumen.scoreGeneral || 0;

    // Score de IA
    const scoreIA = explicacionesIA.resumen.scoreGeneral || 0;

    // Score de reglas
    const scoreReglas = this.calcularScoreReglas(validacionReglas);

    // Score general ponderado
    const scoreGeneral = this.calcularScoreGeneral(
      scoreValidacion,
      scoreIA,
      scoreReglas,
    );

    return {
      scoreValidacion,
      scoreIA,
      scoreReglas,
      scoreGeneral,
    };
  }

  /**
   * Calcula el score de reglas
   */
  private calcularScoreReglas(validacionReglas: any[]): number {
    if (validacionReglas.length === 0) return 100;

    const scores = validacionReglas.map(v => v.scoreCumplimiento || 0);
    const scorePromedio = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return Math.round(scorePromedio * 100) / 100;
  }

  /**
   * Calcula el score general ponderado
   */
  private calcularScoreGeneral(
    scoreValidacion: number,
    scoreIA: number,
    scoreReglas: number,
  ): number {
    // Pesos configurables (pueden venir de BD)
    const pesoValidacion = 0.4; // 40%
    const pesoIA = 0.35; // 35%
    const pesoReglas = 0.25; // 25%

    const scoreGeneral =
      scoreValidacion * pesoValidacion +
      scoreIA * pesoIA +
      scoreReglas * pesoReglas;

    return Math.round(scoreGeneral * 100) / 100;
  }

  /**
   * Determina el estado general del sistema
   */
  private determinarEstadoGeneral(scores: {
    scoreGeneral: number;
    scoreValidacion: number;
    scoreIA: number;
    scoreReglas: number;
  }): ValidacionInteligente['estadoGeneral'] {
    const { scoreGeneral, scoreValidacion, scoreIA, scoreReglas } = scores;

    // Si algún componente crítico falla, el sistema requiere revisión
    if (scoreValidacion < 50 || scoreReglas < 50) {
      return 'REQUIERE_REVISION';
    }

    // Si el score general es alto, está aprobado
    if (scoreGeneral >= 80) {
      return 'APROBADO';
    }

    // Si hay observaciones pero no críticas
    if (scoreGeneral >= 60) {
      return 'CON_OBSERVACIONES';
    }

    // En otro caso, rechazado
    return 'RECHAZADO';
  }

  /**
   * Consolida insights de todos los servicios
   */
  private consolidarInsights(
    validacionBasica: any,
    explicacionesIA: any,
    validacionReglas: any[],
  ): ValidacionInteligente['insights'] {
    // Insights de IA
    const insightsIA = explicacionesIA.insights || {};

    // Insights de reglas
    const insightsReglas = this.extraerInsightsReglas(validacionReglas);

    // Consolidar patrones
    const patrones = [
      ...(insightsIA.patronesIdentificados || []),
      ...(insightsReglas.patrones || []),
    ];

    // Consolidar oportunidades
    const oportunidades = [
      ...(insightsIA.oportunidadesMejora || []),
      ...(insightsReglas.oportunidades || []),
    ];

    // Consolidar riesgos
    const riesgos = [
      ...(insightsIA.riesgosPotenciales || []),
      ...(insightsReglas.riesgos || []),
    ];

    // Consolidar tendencias
    const tendencias = [
      ...(insightsIA.tendenciasNormativas || []),
      ...(insightsReglas.tendencias || []),
    ];

    // Recomendaciones de IA
    const recomendacionesIA = this.extraerRecomendacionesIA(explicacionesIA);

    // Optimizaciones sugeridas
    const optimizaciones = this.extraerOptimizaciones(explicacionesIA);

    return {
      patronesIdentificados: this.eliminarDuplicados(patrones),
      oportunidadesMejora: this.eliminarDuplicados(oportunidades),
      riesgosPotenciales: this.eliminarDuplicados(riesgos),
      tendenciasNormativas: this.eliminarDuplicados(tendencias),
      recomendacionesIA,
      optimizacionesSugeridas: optimizaciones,
    };
  }

  /**
   * Extrae insights de las reglas
   */
  private extraerInsightsReglas(validacionReglas: any[]): {
    patrones: string[];
    oportunidades: string[];
    riesgos: string[];
    tendencias: string[];
  } {
    const patrones: string[] = [];
    const oportunidades: string[] = [];
    const riesgos: string[] = [];
    const tendencias: string[] = [];

    for (const validacion of validacionReglas) {
      // Analizar patrones por categoría
      const porCategoria = this.agruparPorCategoria(validacion.resultados);

      if (porCategoria.SEGURIDAD?.length > 0) {
        riesgos.push(`Problemas de seguridad identificados en ${validacion.circuitoId}`);
      }

      if (porCategoria.EFICIENCIA?.length > 0) {
        oportunidades.push(`Oportunidades de eficiencia en ${validacion.circuitoId}`);
      }

      if (porCategoria.COSTO?.length > 0) {
        oportunidades.push(`Optimizaciones de costo en ${validacion.circuitoId}`);
      }
    }

    // Identificar tendencias
    if (riesgos.length > 0) {
      tendencias.push('Necesidad de mayor enfoque en seguridad');
    }

    if (oportunidades.length > 0) {
      tendencias.push('Potencial de optimización en múltiples áreas');
    }

    return { patrones, oportunidades, riesgos, tendencias };
  }

  /**
   * Agrupa resultados por categoría
   */
  private agruparPorCategoria(resultados: any[]): Record<string, any[]> {
    const agrupados: Record<string, any[]> = {};

    for (const resultado of resultados) {
      const categoria = resultado.categoria;
      if (!agrupados[categoria]) {
        agrupados[categoria] = [];
      }
      agrupados[categoria].push(resultado);
    }

    return agrupados;
  }

  /**
   * Extrae recomendaciones de IA
   */
  private extraerRecomendacionesIA(explicacionesIA: any): string[] {
    const recomendaciones: string[] = [];

    for (const explicacion of explicacionesIA.explicaciones || []) {
      recomendaciones.push(...(explicacion.recomendaciones || []));
    }

    return this.eliminarDuplicados(recomendaciones);
  }

  /**
   * Extrae optimizaciones sugeridas
   */
  private extraerOptimizaciones(explicacionesIA: any): string[] {
    const optimizaciones: string[] = [];

    for (const explicacion of explicacionesIA.explicaciones || []) {
      for (const optimizacion of explicacion.optimizaciones || []) {
        optimizaciones.push(optimizacion.descripcion);
      }
    }

    return this.eliminarDuplicados(optimizaciones);
  }

  /**
   * Elimina duplicados de un array
   */
  private eliminarDuplicados(array: string[]): string[] {
    return [...new Set(array)];
  }

  /**
   * Genera recomendaciones priorizadas
   */
  private generarRecomendacionesPriorizadas(
    validacionBasica: any,
    explicacionesIA: any,
    validacionReglas: any[],
  ): ValidacionInteligente['recomendaciones'] {
    const criticas: string[] = [];
    const altas: string[] = [];
    const medias: string[] = [];
    const bajas: string[] = [];

    // Recomendaciones críticas de reglas
    for (const validacion of validacionReglas) {
      const fallasCriticas = validacion.resultados.filter(
        (r: any) => r.resultado === 'FALLA' && r.prioridad === 'CRITICA',
      );

      for (const falla of fallasCriticas) {
        criticas.push(`[CRÍTICO] ${falla.mensaje} - ${falla.solucion}`);
      }
    }

    // Recomendaciones altas de reglas
    for (const validacion of validacionReglas) {
      const fallasAltas = validacion.resultados.filter(
        (r: any) => r.resultado === 'FALLA' && r.prioridad === 'ALTA',
      );

      for (const falla of fallasAltas) {
        altas.push(`[ALTO] ${falla.mensaje} - ${falla.solucion}`);
      }
    }

    // Recomendaciones de IA
    for (const explicacion of explicacionesIA.explicaciones || []) {
      for (const optimizacion of explicacion.optimizaciones || []) {
        switch (optimizacion.impacto) {
          case 'ALTO':
            altas.push(`[IA] ${optimizacion.descripcion}`);
            break;
          case 'MEDIO':
            medias.push(`[IA] ${optimizacion.descripcion}`);
            break;
          case 'BAJO':
            bajas.push(`[IA] ${optimizacion.descripcion}`);
            break;
        }
      }
    }

    // Recomendaciones de validación básica
    if (validacionBasica.observaciones?.length > 0) {
      for (const observacion of validacionBasica.observaciones) {
        medias.push(`[VALIDACIÓN] ${observacion}`);
      }
    }

    // Generar lista priorizada
    const priorizadas = [
      ...criticas,
      ...altas,
      ...medias,
      ...bajas,
    ];

    return {
      criticas,
      altas,
      medias,
      bajas,
      priorizadas,
    };
  }

  /**
   * Cuenta reglas evaluadas
   */
  private contarReglasEvaluadas(validacionReglas: any[]): number {
    return validacionReglas.reduce(
      (total, validacion) => total + (validacion.reglasEvaluadas || 0),
      0,
    );
  }

  /**
   * Obtiene métricas del sistema de reglas
   */
  async obtenerMetricasReglas(): Promise<any> {
    try {
      return await this.ruleEngineService.obtenerSistemaReglas();
    } catch (error) {
      this.logger.warn('Error obteniendo métricas de reglas', error);
      return {
        reglas: [],
        version: '1.0.0',
        fechaActualizacion: new Date(),
        activas: 0,
        totales: 0,
      };
    }
  }

  /**
   * Valida un circuito específico con todos los servicios
   */
  async validarCircuitoInteligente(
    circuito: any,
    contexto: any,
    warnings: string[] = [],
  ): Promise<{
    validacionBasica: any;
    explicacionIA: any;
    validacionReglas: any;
    scoreGeneral: number;
  }> {
    try {
      // Validación básica
      const validacionBasica = await this.validationService.validarSistemaCompleto(
        {
          id: 'CIRCUITO_INDIVIDUAL',
          cargas: [circuito],
          tensionNominal: 120,
          tipoSistema: 'MONOFASICO',
          parametrosAmbiente: { temperatura: 25, tipoInstalacion: 'TUBERIA', materialConductor: 'COBRE' },
        },
        warnings,
      );

      // Explicación IA
      const explicacionIA = await this.aiExplanationService.generarExplicacionCircuito(
        circuito,
        contexto,
        warnings,
      );

      // Validación reglas
      const validacionReglas = await this.ruleEngineService.validarCircuito(
        circuito,
        warnings,
      );

      // Score general
      const scoreGeneral = this.calcularScoreGeneral(
        validacionBasica.resumen.scoreGeneral || 0,
        explicacionIA.scoreInteligencia,
        validacionReglas.scoreCumplimiento || 0,
      );

      return {
        validacionBasica,
        explicacionIA,
        validacionReglas,
        scoreGeneral,
      };
    } catch (error) {
      this.logger.error('Error en validación inteligente del circuito', error);
      throw new Error(`Error en validación inteligente del circuito: ${error.message}`);
    }
  }

  /**
   * Genera reporte ejecutivo del sistema
   */
  async generarReporteEjecutivo(
    sistema: any,
    warnings: string[] = [],
  ): Promise<{
    resumen: string;
    estado: string;
    recomendacionesPrincipales: string[];
    metricas: any;
    proximosPasos: string[];
  }> {
    try {
      const validacion = await this.validarSistemaInteligente(sistema, warnings);

      // Generar resumen ejecutivo
      const resumen = this.generarResumenEjecutivo(validacion);

      // Estado del sistema
      const estado = this.generarEstadoEjecutivo(validacion);

      // Recomendaciones principales
      const recomendacionesPrincipales = validacion.recomendaciones.priorizadas.slice(0, 5);

      // Próximos pasos
      const proximosPasos = this.generarProximosPasos(validacion);

      return {
        resumen,
        estado,
        recomendacionesPrincipales,
        metricas: validacion.metricas,
        proximosPasos,
      };
    } catch (error) {
      this.logger.error('Error generando reporte ejecutivo', error);
      throw new Error(`Error generando reporte ejecutivo: ${error.message}`);
    }
  }

  /**
   * Genera resumen ejecutivo
   */
  private generarResumenEjecutivo(validacion: ValidacionInteligente): string {
    const { resumen, estadoGeneral } = validacion;

    return `Sistema eléctrico con ${resumen.totalCircuitos} circuitos.
    Estado: ${estadoGeneral}.
    Score general: ${resumen.scoreGeneral}/100.
    ${resumen.circuitosAprobados} circuitos aprobados,
    ${resumen.circuitosConObservaciones} con observaciones,
    ${resumen.circuitosRechazados} rechazados.`;
  }

  /**
   * Genera estado ejecutivo
   */
  private generarEstadoEjecutivo(validacion: ValidacionInteligente): string {
    switch (validacion.estadoGeneral) {
      case 'APROBADO':
        return '✅ SISTEMA APROBADO - Listo para implementación';
      case 'CON_OBSERVACIONES':
        return '⚠️ SISTEMA CON OBSERVACIONES - Requiere atención antes de implementación';
      case 'RECHAZADO':
        return '❌ SISTEMA RECHAZADO - Requiere correcciones significativas';
      case 'REQUIERE_REVISION':
        return '🚨 SISTEMA REQUIERE REVISIÓN CRÍTICA - No apto para implementación';
      default:
        return '❓ ESTADO NO DETERMINADO';
    }
  }

  /**
   * Genera próximos pasos
   */
  private generarProximosPasos(validacion: ValidacionInteligente): string[] {
    const pasos: string[] = [];

    if (validacion.estadoGeneral === 'APROBADO') {
      pasos.push('Proceder con la implementación del sistema');
      pasos.push('Documentar decisiones de diseño para futuras referencias');
      pasos.push('Implementar monitoreo continuo del sistema');
    } else if (validacion.estadoGeneral === 'CON_OBSERVACIONES') {
      pasos.push('Revisar y corregir las observaciones identificadas');
      pasos.push('Revalidar el sistema después de las correcciones');
      pasos.push('Considerar las optimizaciones sugeridas por IA');
    } else {
      pasos.push('Corregir inmediatamente las reglas críticas que fallan');
      pasos.push('Revisar el diseño completo del sistema');
      pasos.push('Consultar con ingenieros senior para validación');
      pasos.push('Revalidar después de las correcciones principales');
    }

    pasos.push('Actualizar documentación del proyecto');
    pasos.push('Programar revisión periódica del sistema');

    return pasos;
  }
}
