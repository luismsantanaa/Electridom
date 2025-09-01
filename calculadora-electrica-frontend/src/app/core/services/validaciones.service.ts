import { Injectable } from '@angular/core';

export interface ValidacionResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export interface ValidacionTomas {
  ambiente: string;
  areaM2: number;
  tomasCalculadas: number;
  tomasMaximas: number;
  exceso: number;
}

export interface ValidacionLuminarias {
  ambiente: string;
  areaM2: number;
  luminariasCalculadas: number;
  luminariasMaximas: number;
  exceso: number;
}

export interface ValidacionCaidaTension {
  circuito: string;
  longitud: number;
  corriente: number;
  caidaCalculada: number;
  caidaMaxima: number;
  porcentaje: number;
}

export interface ValidacionSimultaneidad {
  tipo: string;
  cantidad: number;
  factorSimultaneidad: number;
  potenciaTotal: number;
  potenciaSimultanea: number;
}

@Injectable({
  providedIn: 'root'
})
export class ValidacionesService {

  // Tablas normativas
  private readonly TABLAS_NORMATIVAS = {
    // Tomas por ambiente según NTE-IEBT
    tomas: {
      'Sala': { maxTomas: 6, areaMinima: 15 },
      'Dormitorio': { maxTomas: 4, areaMinima: 12 },
      'Cocina': { maxTomas: 8, areaMinima: 10 },
      'Baño': { maxTomas: 2, areaMinima: 6 },
      'Comedor': { maxTomas: 4, areaMinima: 12 },
      'Oficina': { maxTomas: 6, areaMinima: 15 },
      'Garaje': { maxTomas: 2, areaMinima: 20 },
      'default': { maxTomas: 4, areaMinima: 12 }
    },

    // Luminarias por ambiente
    luminarias: {
      'Sala': { maxLuminarias: 8, areaMinima: 15 },
      'Dormitorio': { maxLuminarias: 4, areaMinima: 12 },
      'Cocina': { maxLuminarias: 6, areaMinima: 10 },
      'Baño': { maxLuminarias: 3, areaMinima: 6 },
      'Comedor': { maxLuminarias: 4, areaMinima: 12 },
      'Oficina': { maxLuminarias: 6, areaMinima: 15 },
      'Garaje': { maxLuminarias: 2, areaMinima: 20 },
      'default': { maxLuminarias: 4, areaMinima: 12 }
    },

    // Caída de tensión máxima según NTE-IEBT
    caidaTension: {
      'Alumbrado': 3.0, // 3%
      'Fuerza': 5.0,    // 5%
      'Mixto': 4.0      // 4%
    },

    // Factores de simultaneidad
    simultaneidad: {
      'Aire Acondicionado': 0.8,
      'Calefacción': 0.7,
      'Cocina': 0.6,
      'Lavadora': 0.5,
      'Secadora': 0.5,
      'Refrigerador': 1.0, // Siempre conectado
      'Televisor': 0.8,
      'Computadora': 0.7,
      'default': 0.8
    }
  };

  constructor() {}

  /**
   * HU14.1 - Validación de tomas
   * Valida el número de tomas por ambiente según normativas
   */
  validarTomas(ambientes: Array<{nombre: string, areaM2: number, tomas: number}>): ValidacionTomas[] {
    const resultados: ValidacionTomas[] = [];

    ambientes.forEach(ambiente => {
      const normativa = this.TABLAS_NORMATIVAS.tomas[ambiente.nombre] || this.TABLAS_NORMATIVAS.tomas.default;
      const tomasMaximas = Math.ceil(ambiente.areaM2 / normativa.areaMinima) * normativa.maxTomas;
      const exceso = ambiente.tomas > tomasMaximas ? ambiente.tomas - tomasMaximas : 0;

      resultados.push({
        ambiente: ambiente.nombre,
        areaM2: ambiente.areaM2,
        tomasCalculadas: ambiente.tomas,
        tomasMaximas,
        exceso
      });
    });

    return resultados;
  }

  /**
   * HU14.2 - Validación de luminarias
   * Valida el número de luminarias por ambiente
   */
  validarLuminarias(ambientes: Array<{nombre: string, areaM2: number, luminarias: number}>): ValidacionLuminarias[] {
    const resultados: ValidacionLuminarias[] = [];

    ambientes.forEach(ambiente => {
      const normativa = this.TABLAS_NORMATIVAS.luminarias[ambiente.nombre] || this.TABLAS_NORMATIVAS.luminarias.default;
      const luminariasMaximas = Math.ceil(ambiente.areaM2 / normativa.areaMinima) * normativa.maxLuminarias;
      const exceso = ambiente.luminarias > luminariasMaximas ? ambiente.luminarias - luminariasMaximas : 0;

      resultados.push({
        ambiente: ambiente.nombre,
        areaM2: ambiente.areaM2,
        luminariasCalculadas: ambiente.luminarias,
        luminariasMaximas,
        exceso
      });
    });

    return resultados;
  }

  /**
   * HU14.3 - Validación de caída de tensión
   * Calcula y valida la caída de tensión en conductores
   */
  validarCaidaTension(
    circuitos: Array<{
      nombre: string,
      tipo: string,
      longitud: number,
      corriente: number,
      calibre: string,
      material: string
    }>
  ): ValidacionCaidaTension[] {
    const resultados: ValidacionCaidaTension[] = [];

    circuitos.forEach(circuito => {
      // Resistencia específica (Ω/km) según material y calibre
      const resistencia = this.calcularResistencia(circuito.calibre, circuito.material);
      
      // Caída de tensión en V
      const caidaVoltios = (resistencia * circuito.longitud * circuito.corriente) / 1000;
      
      // Caída de tensión en porcentaje (asumiendo 120V)
      const tensionSistema = 120; // Se puede hacer configurable
      const caidaPorcentaje = (caidaVoltios / tensionSistema) * 100;
      
      // Caída máxima permitida según tipo de circuito
      const caidaMaxima = this.TABLAS_NORMATIVAS.caidaTension[circuito.tipo] || 4.0;

      resultados.push({
        circuito: circuito.nombre,
        longitud: circuito.longitud,
        corriente: circuito.corriente,
        caidaCalculada: caidaPorcentaje,
        caidaMaxima,
        porcentaje: (caidaPorcentaje / caidaMaxima) * 100
      });
    });

    return resultados;
  }

  /**
   * HU14.4 - Validación de simultaneidad
   * Calcula factores de simultaneidad para equipos
   */
  validarSimultaneidad(
    equipos: Array<{tipo: string, cantidad: number, potenciaUnitaria: number}>
  ): ValidacionSimultaneidad[] {
    const resultados: ValidacionSimultaneidad[] = [];

    equipos.forEach(equipo => {
      const factorSimultaneidad = this.TABLAS_NORMATIVAS.simultaneidad[equipo.tipo] || 
                                 this.TABLAS_NORMATIVAS.simultaneidad.default;
      
      const potenciaTotal = equipo.cantidad * equipo.potenciaUnitaria;
      const potenciaSimultanea = potenciaTotal * factorSimultaneidad;

      resultados.push({
        tipo: equipo.tipo,
        cantidad: equipo.cantidad,
        factorSimultaneidad,
        potenciaTotal,
        potenciaSimultanea
      });
    });

    return resultados;
  }

  /**
   * Validación completa del proyecto
   */
  validarProyectoCompleto(proyecto: any): ValidacionResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];

    // Validar tomas
    if (proyecto.ambientes) {
      const validacionTomas = this.validarTomas(proyecto.ambientes);
      validacionTomas.forEach(toma => {
        if (toma.exceso > 0) {
          warnings.push(`Exceso de tomas en ${toma.ambiente}: ${toma.exceso} tomas adicionales`);
          recommendations.push(`Considerar reducir tomas en ${toma.ambiente} o aumentar área`);
        }
      });
    }

    // Validar luminarias
    if (proyecto.ambientes) {
      const validacionLuminarias = this.validarLuminarias(proyecto.ambientes);
      validacionLuminarias.forEach(luminaria => {
        if (luminaria.exceso > 0) {
          warnings.push(`Exceso de luminarias en ${luminaria.ambiente}: ${luminaria.exceso} luminarias adicionales`);
          recommendations.push(`Considerar reducir luminarias en ${luminaria.ambiente} o aumentar área`);
        }
      });
    }

    // Validar caída de tensión
    if (proyecto.circuitos) {
      const validacionCaida = this.validarCaidaTension(proyecto.circuitos);
      validacionCaida.forEach(caida => {
        if (caida.caidaCalculada > caida.caidaMaxima) {
          errors.push(`Caída de tensión excesiva en ${caida.circuito}: ${caida.caidaCalculada.toFixed(2)}% > ${caida.caidaMaxima}%`);
          recommendations.push(`Aumentar calibre del conductor en ${caida.circuito} o reducir longitud`);
        }
      });
    }

    // Validar simultaneidad
    if (proyecto.equipos) {
      const validacionSimultaneidad = this.validarSimultaneidad(proyecto.equipos);
      validacionSimultaneidad.forEach(sim => {
        if (sim.potenciaSimultanea > 5000) { // Ejemplo: límite de 5kW
          warnings.push(`Potencia simultánea alta para ${sim.tipo}: ${sim.potenciaSimultanea.toFixed(0)}W`);
          recommendations.push(`Considerar distribuir ${sim.tipo} en múltiples circuitos`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      recommendations
    };
  }

  /**
   * Calcular resistencia específica del conductor
   */
  private calcularResistencia(calibre: string, material: string): number {
    // Resistencia específica en Ω/km
    const resistencias = {
      'Cobre': {
        '14': 8.28,
        '12': 5.21,
        '10': 3.28,
        '8': 2.06,
        '6': 1.30,
        '4': 0.82,
        '3': 0.65,
        '2': 0.52,
        '1': 0.41,
        '1/0': 0.33,
        '2/0': 0.26,
        '3/0': 0.21,
        '4/0': 0.16
      },
      'Aluminio': {
        '12': 13.7,
        '10': 8.61,
        '8': 5.41,
        '6': 3.40,
        '4': 2.14,
        '3': 1.70,
        '2': 1.36,
        '1': 1.08,
        '1/0': 0.86,
        '2/0': 0.68,
        '3/0': 0.54,
        '4/0': 0.43
      }
    };

    return resistencias[material]?.[calibre] || 8.28; // Default: Cu 14 AWG
  }

  /**
   * Obtener recomendaciones específicas
   */
  getRecomendacionesEspecificas(validacion: ValidacionResult): string[] {
    const recomendaciones: string[] = [];

    if (validacion.warnings.length > 0) {
      recomendaciones.push('⚠️ Advertencias detectadas:');
      validacion.warnings.forEach(warning => {
        recomendaciones.push(`   • ${warning}`);
      });
    }

    if (validacion.errors.length > 0) {
      recomendaciones.push('❌ Errores críticos:');
      validacion.errors.forEach(error => {
        recomendaciones.push(`   • ${error}`);
      });
    }

    if (validacion.recommendations.length > 0) {
      recomendaciones.push('💡 Recomendaciones:');
      validacion.recommendations.forEach(rec => {
        recomendaciones.push(`   • ${rec}`);
      });
    }

    return recomendaciones;
  }
}
