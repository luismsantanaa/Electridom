import { Injectable, Logger } from '@nestjs/common';
import { NormParamService } from './norm-param.service';

export interface ReglaNormativa {
  id: string;
  nombre: string;
  categoria: 'SEGURIDAD' | 'EFICIENCIA' | 'COSTO' | 'MANTENIMIENTO' | 'NORMATIVA';
  prioridad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  condicion: {
    tipo: 'COMPARACION' | 'RANGO' | 'BOOLEANA' | 'ENUMERACION' | 'COMPUESTA';
    campo: string;
    operador: 'IGUAL' | 'MAYOR' | 'MENOR' | 'MAYOR_IGUAL' | 'MENOR_IGUAL' | 'DIFERENTE' | 'IN' | 'NOT_IN';
    valor: any;
    valor2?: any; // Para rangos
    operadorLogico?: 'AND' | 'OR'; // Para condiciones compuestas
    condiciones?: ReglaNormativa['condicion'][]; // Para condiciones compuestas
  };
  accion: {
    tipo: 'ERROR' | 'WARNING' | 'INFO' | 'RECOMENDACION';
    mensaje: string;
    codigo: string;
    solucion: string;
    impacto: 'ALTO' | 'MEDIO' | 'BAJO';
  };
  aplicable: string[]; // Tipos de circuito donde aplica
  version: string;
  activa: boolean;
}

export interface ResultadoValidacion {
  reglaId: string;
  nombre: string;
  categoria: ReglaNormativa['categoria'];
  prioridad: ReglaNormativa['prioridad'];
  resultado: 'PASA' | 'FALLA' | 'ADVERTENCIA';
  mensaje: string;
  codigo: string;
  solucion: string;
  impacto: 'ALTO' | 'MEDIO' | 'BAJO';
  datos: {
    valorActual: any;
    valorEsperado: any;
    campo: string;
  };
  timestamp: Date;
}

export interface ValidacionCompleta {
  circuitoId: string;
  timestamp: Date;
  reglasEvaluadas: number;
  reglasPasadas: number;
  reglasFallidas: number;
  advertencias: number;
  scoreCumplimiento: number; // 0-100
  resultados: ResultadoValidacion[];
  resumen: {
    criticos: number;
    altos: number;
    medios: number;
    bajos: number;
  };
  recomendaciones: string[];
}

export interface SistemaReglas {
  reglas: ReglaNormativa[];
  version: string;
  fechaActualizacion: Date;
  activas: number;
  totales: number;
}

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);
  private reglasCache: ReglaNormativa[] = [];
  private ultimaActualizacion: Date = new Date(0);

  constructor(private readonly normParamService: NormParamService) {}

  /**
   * Valida un circuito contra todas las reglas aplicables
   */
  async validarCircuito(
    circuito: any,
    warnings: string[] = [],
  ): Promise<ValidacionCompleta> {
    try {
      // Obtener reglas actualizadas
      const reglas = await this.obtenerReglasActualizadas(warnings);

      // Filtrar reglas aplicables al tipo de circuito
      const reglasAplicables = this.filtrarReglasAplicables(reglas, circuito);

      // Evaluar cada regla
      const resultados: ResultadoValidacion[] = [];
      let reglasPasadas = 0;
      let reglasFallidas = 0;
      let advertencias = 0;

      for (const regla of reglasAplicables) {
        try {
          const resultado = this.evaluarRegla(regla, circuito);
          resultados.push(resultado);

          switch (resultado.resultado) {
            case 'PASA':
              reglasPasadas++;
              break;
            case 'FALLA':
              reglasFallidas++;
              break;
            case 'ADVERTENCIA':
              advertencias++;
              break;
          }
        } catch (error) {
          this.logger.warn(`Error evaluando regla ${regla.id}`, error);
          warnings.push(`Regla ${regla.id}: ${error.message}`);
        }
      }

      // Calcular score de cumplimiento
      const scoreCumplimiento = this.calcularScoreCumplimiento(resultados);

      // Generar resumen por prioridad
      const resumen = this.calcularResumenPrioridades(resultados);

      // Generar recomendaciones
      const recomendaciones = this.generarRecomendaciones(resultados);

      return {
        circuitoId: circuito.id || circuito.circuitoId || 'UNKNOWN',
        timestamp: new Date(),
        reglasEvaluadas: reglasAplicables.length,
        reglasPasadas,
        reglasFallidas,
        advertencias,
        scoreCumplimiento,
        resultados,
        resumen,
        recomendaciones,
      };
    } catch (error) {
      this.logger.error('Error en validación de circuito', error);
      throw new Error(`Error en validación de reglas: ${error.message}`);
    }
  }

  /**
   * Valida múltiples circuitos
   */
  async validarCircuitosMultiples(
    circuitos: any[],
  ): Promise<ValidacionCompleta[]> {
    const resultados: ValidacionCompleta[] = [];
    const warnings: string[] = [];

    for (const circuito of circuitos) {
      try {
        const resultado = await this.validarCircuito(circuito, warnings);
        resultados.push(resultado);
      } catch (error) {
        this.logger.warn(
          `Error validando circuito ${circuito.id || circuito.circuitoId}`,
          error,
        );
        warnings.push(`Circuito ${circuito.id || circuito.circuitoId}: ${error.message}`);
      }
    }

    return resultados;
  }

  /**
   * Obtiene las reglas actualizadas desde la base de datos
   */
  private async obtenerReglasActualizadas(
    warnings: string[],
  ): Promise<ReglaNormativa[]> {
    try {
      // Verificar si necesitamos actualizar el cache
      const ahora = new Date();
      const tiempoCache = 5 * 60 * 1000; // 5 minutos

      if (
        this.reglasCache.length === 0 ||
        ahora.getTime() - this.ultimaActualizacion.getTime() > tiempoCache
      ) {
        const reglas = await this.normParamService.getParam('REGLAS_NORMATIVAS');
        const reglasParsed = JSON.parse(reglas);

        if (!reglasParsed || !Array.isArray(reglasParsed)) {
          this.logger.warn(
            'Reglas normativas no encontradas o inválidas, usando reglas por defecto',
            { warnings },
          );
          this.reglasCache = this.obtenerReglasPorDefecto();
        } else {
          this.reglasCache = reglasParsed.filter((r: ReglaNormativa) => r.activa);
        }

        this.ultimaActualizacion = ahora;
        this.logger.log(`Cache de reglas actualizado: ${this.reglasCache.length} reglas activas`);
      }

      return this.reglasCache;
    } catch (error) {
      this.logger.warn(
        'Error obteniendo reglas, usando reglas por defecto',
        { warnings },
      );
      return this.obtenerReglasPorDefecto();
    }
  }

  /**
   * Filtra las reglas aplicables al tipo de circuito
   */
  private filtrarReglasAplicables(
    reglas: ReglaNormativa[],
    circuito: any,
  ): ReglaNormativa[] {
    const tipoCircuito = circuito.tipo || circuito.resultado?.tipo || 'GENERAL';

    return reglas.filter(regla => {
      // Regla aplicable a todos los circuitos
      if (regla.aplicable.includes('TODOS') || regla.aplicable.includes('GENERAL')) {
        return true;
      }

      // Regla específica para el tipo de circuito
      return regla.aplicable.some(tipo =>
        tipoCircuito.toUpperCase().includes(tipo.toUpperCase()) ||
        tipo.toUpperCase().includes(tipoCircuito.toUpperCase())
      );
    });
  }

  /**
   * Evalúa una regla específica contra un circuito
   */
  private evaluarRegla(regla: ReglaNormativa, circuito: any): ResultadoValidacion {
    const resultado = this.evaluarCondicion(regla.condicion, circuito);

    let resultadoValidacion: ResultadoValidacion['resultado'];
    let mensaje: string;

    if (resultado) {
      resultadoValidacion = 'PASA';
      mensaje = `Cumple con la regla: ${regla.nombre}`;
    } else {
      switch (regla.accion.tipo) {
        case 'ERROR':
          resultadoValidacion = 'FALLA';
          mensaje = regla.accion.mensaje;
          break;
        case 'WARNING':
          resultadoValidacion = 'ADVERTENCIA';
          mensaje = regla.accion.mensaje;
          break;
        case 'INFO':
        case 'RECOMENDACION':
          resultadoValidacion = 'ADVERTENCIA';
          mensaje = regla.accion.mensaje;
          break;
        default:
          resultadoValidacion = 'FALLA';
          mensaje = regla.accion.mensaje;
      }
    }

    return {
      reglaId: regla.id,
      nombre: regla.nombre,
      categoria: regla.categoria,
      prioridad: regla.prioridad,
      resultado: resultadoValidacion,
      mensaje,
      codigo: regla.accion.codigo,
      solucion: regla.accion.solucion,
      impacto: regla.accion.impacto,
      datos: this.obtenerDatosValidacion(regla.condicion, circuito),
      timestamp: new Date(),
    };
  }

  /**
   * Evalúa una condición de regla
   */
  private evaluarCondicion(condicion: ReglaNormativa['condicion'], circuito: any): boolean {
    switch (condicion.tipo) {
      case 'COMPARACION':
        return this.evaluarComparacion(condicion, circuito);
      case 'RANGO':
        return this.evaluarRango(condicion, circuito);
      case 'BOOLEANA':
        return this.evaluarBooleana(condicion, circuito);
      case 'ENUMERACION':
        return this.evaluarEnumeracion(condicion, circuito);
      case 'COMPUESTA':
        return this.evaluarCondicionCompuesta(condicion, circuito);
      default:
        this.logger.warn(`Tipo de condición no soportado: ${condicion.tipo}`);
        return false;
    }
  }

  /**
   * Evalúa condición de comparación
   */
  private evaluarComparacion(
    condicion: ReglaNormativa['condicion'],
    circuito: any,
  ): boolean {
    const valorActual = this.obtenerValorCampo(condicion.campo, circuito);
    const valorEsperado = condicion.valor;

    switch (condicion.operador) {
      case 'IGUAL':
        return valorActual === valorEsperado;
      case 'DIFERENTE':
        return valorActual !== valorEsperado;
      case 'MAYOR':
        return valorActual > valorEsperado;
      case 'MENOR':
        return valorActual < valorEsperado;
      case 'MAYOR_IGUAL':
        return valorActual >= valorEsperado;
      case 'MENOR_IGUAL':
        return valorActual <= valorEsperado;
      default:
        this.logger.warn(`Operador de comparación no soportado: ${condicion.operador}`);
        return false;
    }
  }

  /**
   * Evalúa condición de rango
   */
  private evaluarRango(
    condicion: ReglaNormativa['condicion'],
    circuito: any,
  ): boolean {
    const valorActual = this.obtenerValorCampo(condicion.campo, circuito);
    const valorMin = condicion.valor;
    const valorMax = condicion.valor2;

    if (valorMin === undefined || valorMax === undefined) {
      this.logger.warn('Condición de rango incompleta');
      return false;
    }

    return valorActual >= valorMin && valorActual <= valorMax;
  }

  /**
   * Evalúa condición booleana
   */
  private evaluarBooleana(
    condicion: ReglaNormativa['condicion'],
    circuito: any,
  ): boolean {
    const valorActual = this.obtenerValorCampo(condicion.campo, circuito);
    const valorEsperado = condicion.valor;

    return Boolean(valorActual) === Boolean(valorEsperado);
  }

  /**
   * Evalúa condición de enumeración
   */
  private evaluarEnumeracion(
    condicion: ReglaNormativa['condicion'],
    circuito: any,
  ): boolean {
    const valorActual = this.obtenerValorCampo(condicion.campo, circuito);
    const valoresEsperados = Array.isArray(condicion.valor) ? condicion.valor : [condicion.valor];

    switch (condicion.operador) {
      case 'IN':
        return valoresEsperados.includes(valorActual);
      case 'NOT_IN':
        return !valoresEsperados.includes(valorActual);
      default:
        this.logger.warn(`Operador de enumeración no soportado: ${condicion.operador}`);
        return false;
    }
  }

  /**
   * Evalúa condición compuesta
   */
  private evaluarCondicionCompuesta(
    condicion: ReglaNormativa['condicion'],
    circuito: any,
  ): boolean {
    if (!condicion.condiciones || !condicion.operadorLogico) {
      this.logger.warn('Condición compuesta incompleta');
      return false;
    }

    const resultados = condicion.condiciones.map(c => this.evaluarCondicion(c, circuito));

    switch (condicion.operadorLogico) {
      case 'AND':
        return resultados.every(r => r);
      case 'OR':
        return resultados.some(r => r);
      default:
        this.logger.warn(`Operador lógico no soportado: ${condicion.operadorLogico}`);
        return false;
    }
  }

  /**
   * Obtiene el valor de un campo del circuito
   */
  private obtenerValorCampo(campo: string, circuito: any): any {
    // Buscar en diferentes niveles del objeto
    const campos = campo.split('.');
    let valor = circuito;

    for (const campoNivel of campos) {
      if (valor === null || valor === undefined) {
        return undefined;
      }
      valor = valor[campoNivel];
    }

    return valor;
  }

  /**
   * Obtiene los datos para la validación
   */
  private obtenerDatosValidacion(
    condicion: ReglaNormativa['condicion'],
    circuito: any,
  ): ResultadoValidacion['datos'] {
    const valorActual = this.obtenerValorCampo(condicion.campo, circuito);

    return {
      valorActual,
      valorEsperado: condicion.valor,
      campo: condicion.campo,
    };
  }

  /**
   * Calcula el score de cumplimiento
   */
  private calcularScoreCumplimiento(resultados: ResultadoValidacion[]): number {
    if (resultados.length === 0) return 100;

    let scoreTotal = 0;
    let pesoTotal = 0;

    for (const resultado of resultados) {
      let peso = 1;

      // Asignar pesos según prioridad
      switch (resultado.prioridad) {
        case 'CRITICA':
          peso = 4;
          break;
        case 'ALTA':
          peso = 3;
          break;
        case 'MEDIA':
          peso = 2;
          break;
        case 'BAJA':
          peso = 1;
          break;
      }

      // Asignar puntos según resultado
      let puntos = 0;
      switch (resultado.resultado) {
        case 'PASA':
          puntos = 100;
          break;
        case 'ADVERTENCIA':
          puntos = 70;
          break;
        case 'FALLA':
          puntos = 0;
          break;
      }

      scoreTotal += puntos * peso;
      pesoTotal += peso;
    }

    return Math.round(scoreTotal / pesoTotal);
  }

  /**
   * Calcula resumen por prioridades
   */
  private calcularResumenPrioridades(resultados: ResultadoValidacion[]): ValidacionCompleta['resumen'] {
    const resumen = {
      criticos: 0,
      altos: 0,
      medios: 0,
      bajos: 0,
    };

    for (const resultado of resultados) {
      if (resultado.resultado === 'FALLA') {
        switch (resultado.prioridad) {
          case 'CRITICA':
            resumen.criticos++;
            break;
          case 'ALTA':
            resumen.altos++;
            break;
          case 'MEDIA':
            resumen.medios++;
            break;
          case 'BAJA':
            resumen.bajos++;
            break;
        }
      }
    }

    return resumen;
  }

  /**
   * Genera recomendaciones basadas en los resultados
   */
  private generarRecomendaciones(resultados: ResultadoValidacion[]): string[] {
    const recomendaciones: string[] = [];

    // Priorizar recomendaciones por criticidad
    const fallasCriticas = resultados.filter(r =>
      r.resultado === 'FALLA' && r.prioridad === 'CRITICA'
    );

    const fallasAltas = resultados.filter(r =>
      r.resultado === 'FALLA' && r.prioridad === 'ALTA'
    );

    if (fallasCriticas.length > 0) {
      recomendaciones.push('ATENCIÓN CRÍTICA: Corregir inmediatamente las reglas críticas que fallan');
    }

    if (fallasAltas.length > 0) {
      recomendaciones.push('Priorizar la corrección de las reglas de alta prioridad');
    }

    // Recomendaciones específicas por categoría
    const fallasSeguridad = resultados.filter(r =>
      r.resultado === 'FALLA' && r.categoria === 'SEGURIDAD'
    );

    if (fallasSeguridad.length > 0) {
      recomendaciones.push('Revisar aspectos de seguridad antes de la puesta en servicio');
    }

    const fallasEficiencia = resultados.filter(r =>
      r.resultado === 'FALLA' && r.categoria === 'EFICIENCIA'
    );

    if (fallasEficiencia.length > 0) {
      recomendaciones.push('Evaluar optimizaciones de eficiencia para reducir costos operativos');
    }

    // Recomendación general
    if (resultados.filter(r => r.resultado === 'FALLA').length === 0) {
      recomendaciones.push('El sistema cumple con todas las reglas normativas aplicables');
    }

    return recomendaciones;
  }

  /**
   * Obtiene reglas por defecto
   */
  private obtenerReglasPorDefecto(): ReglaNormativa[] {
    return [
      // Reglas de seguridad críticas
      {
        id: 'SEG_001',
        nombre: 'Protección GFCI en baños',
        categoria: 'SEGURIDAD',
        prioridad: 'CRITICA',
        condicion: {
          tipo: 'COMPUESTA',
          campo: 'ambiente',
          operador: 'IN',
          valor: ['BANO', 'BAÑO', 'BATHROOM'],
          operadorLogico: 'AND',
          condiciones: [
            {
              tipo: 'ENUMERACION',
              campo: 'resultado.caracteristicas',
              operador: 'NOT_IN',
              valor: ['GFCI'],
            },
          ],
        },
        accion: {
          tipo: 'ERROR',
          mensaje: 'Se requiere protección GFCI en baños según normas de seguridad',
          codigo: 'GFCI_REQUIRED',
          solucion: 'Cambiar protección por una con características GFCI',
          impacto: 'ALTO',
        },
        aplicable: ['TOM', 'ILU'],
        version: '1.0',
        activa: true,
      },

      // Reglas de eficiencia
      {
        id: 'EFI_001',
        nombre: 'Factor de seguridad adecuado',
        categoria: 'EFICIENCIA',
        prioridad: 'ALTA',
        condicion: {
          tipo: 'COMPARACION',
          campo: 'resultado.factorSeguridad',
          operador: 'MENOR',
          valor: 1.5,
        },
        accion: {
          tipo: 'WARNING',
          mensaje: 'El factor de seguridad es menor al recomendado (1.5)',
          codigo: 'LOW_SAFETY_FACTOR',
          solucion: 'Considerar aumentar el factor de seguridad',
          impacto: 'MEDIO',
        },
        aplicable: ['TODOS'],
        version: '1.0',
        activa: true,
      },

      // Reglas de caída de tensión
      {
        id: 'NORM_001',
        nombre: 'Límite de caída de tensión',
        categoria: 'NORMATIVA',
        prioridad: 'ALTA',
        condicion: {
          tipo: 'COMPARACION',
          campo: 'resultado.caidaPorcentual',
          operador: 'MAYOR',
          valor: 5,
        },
        accion: {
          tipo: 'ERROR',
          mensaje: 'La caída de tensión excede el límite normativo del 5%',
          codigo: 'VOLTAGE_DROP_EXCEEDED',
          solucion: 'Aumentar sección del conductor o reducir longitud',
          impacto: 'ALTO',
        },
        aplicable: ['TODOS'],
        version: '1.0',
        activa: true,
      },

      // Reglas de costo
      {
        id: 'COS_001',
        nombre: 'Optimización de sección de conductor',
        categoria: 'COSTO',
        prioridad: 'MEDIA',
        condicion: {
          tipo: 'COMPARACION',
          campo: 'resultado.seccion',
          operador: 'MAYOR',
          valor: 50,
        },
        accion: {
          tipo: 'RECOMENDACION',
          mensaje: 'Considerar optimización de sección del conductor',
          codigo: 'CONDUCTOR_OPTIMIZATION',
          solucion: 'Evaluar si la sección puede reducirse manteniendo cumplimiento',
          impacto: 'MEDIO',
        },
        aplicable: ['TODOS'],
        version: '1.0',
        activa: true,
      },
    ];
  }

  /**
   * Obtiene información del sistema de reglas
   */
  async obtenerSistemaReglas(): Promise<SistemaReglas> {
    const reglas = await this.obtenerReglasActualizadas([]);

    return {
      reglas,
      version: '1.0.0',
      fechaActualizacion: this.ultimaActualizacion,
      activas: reglas.filter(r => r.activa).length,
      totales: reglas.length,
    };
  }
}
